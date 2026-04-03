
-- 1. Create managed_profiles table
CREATE TABLE public.managed_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id uuid NOT NULL,
  managed_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(manager_id, managed_id)
);

ALTER TABLE public.managed_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage" ON public.managed_profiles FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "managers read own" ON public.managed_profiles FOR SELECT TO authenticated
  USING (auth.uid() = manager_id);

-- 2. Allow managers to read match_predictions of their managed profiles
CREATE POLICY "managers read managed match_predictions"
  ON public.match_predictions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.managed_profiles
      WHERE manager_id = auth.uid() AND managed_id = match_predictions.user_id
    )
  );

-- 3. Allow managers to read extra_predictions of their managed profiles
CREATE POLICY "managers read managed extra_predictions"
  ON public.extra_predictions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.managed_profiles
      WHERE manager_id = auth.uid() AND managed_id = extra_predictions.user_id
    )
  );

-- 4. Allow managers to read knockout_predictions of their managed profiles
CREATE POLICY "managers read managed knockout_predictions"
  ON public.knockout_predictions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.managed_profiles
      WHERE manager_id = auth.uid() AND managed_id = knockout_predictions.user_id
    )
  );

-- 5. Update submit_match_prediction RPC to support acting as managed profile
CREATE OR REPLACE FUNCTION public.submit_match_prediction(
  p_match_id uuid,
  p_predicted_home_score integer,
  p_predicted_away_score integer,
  p_acting_as uuid DEFAULT NULL
)
 RETURNS match_predictions
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid; v_match public.matches; v_prediction public.match_predictions;
begin
  v_user_id := auth.uid();
  if v_user_id is null then raise exception 'Usuário não autenticado'; end if;

  -- If acting as another user, validate the relationship
  if p_acting_as is not null and p_acting_as <> v_user_id then
    if not exists (
      select 1 from public.managed_profiles
      where manager_id = v_user_id and managed_id = p_acting_as
    ) then
      raise exception 'Você não tem permissão para apostar por este perfil';
    end if;
    v_user_id := p_acting_as;
  end if;

  select * into v_match from public.matches where id = p_match_id;
  if not found then raise exception 'Partida não encontrada'; end if;
  if now() >= v_match.kickoff_at then raise exception 'O prazo para apostar nesta partida já encerrou'; end if;

  insert into public.match_predictions (user_id, match_id, predicted_home_score, predicted_away_score, submitted_at)
  values (v_user_id, p_match_id, p_predicted_home_score, p_predicted_away_score, now())
  on conflict (user_id, match_id) do update set
    predicted_home_score = excluded.predicted_home_score,
    predicted_away_score = excluded.predicted_away_score,
    submitted_at = now(), updated_at = now()
  returning * into v_prediction;
  return v_prediction;
end; $function$;
