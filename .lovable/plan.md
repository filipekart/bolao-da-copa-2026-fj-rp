

## Fix: Add kickoff time check to RLS policies

### Problem
The `submit_match_prediction` RPC correctly blocks bets after kickoff, but the RLS policies on `match_predictions` allow direct `INSERT`/`UPDATE` via the Supabase client, bypassing the time check entirely.

### Changes

**Migration SQL:**

1. Create `is_match_open(p_match_id uuid)` — a `SECURITY DEFINER` function returning `true` if `now() < kickoff_at`
2. Drop and recreate the INSERT policy adding `public.is_match_open(match_id)` to the `WITH CHECK`
3. Drop and recreate the UPDATE policy adding `public.is_match_open(match_id)` to the `WITH CHECK`

```sql
CREATE OR REPLACE FUNCTION public.is_match_open(p_match_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT now() < kickoff_at FROM public.matches WHERE id = p_match_id;
$$;

DROP POLICY "users insert own match predictions" ON public.match_predictions;
CREATE POLICY "users insert own match predictions" ON public.match_predictions
  FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id AND public.is_match_open(match_id));

DROP POLICY "users update own match predictions" ON public.match_predictions;
CREATE POLICY "users update own match predictions" ON public.match_predictions
  FOR UPDATE TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND public.is_match_open(match_id));
```

No frontend code changes needed — the RPC path continues to work as before since it uses `SECURITY DEFINER`.

