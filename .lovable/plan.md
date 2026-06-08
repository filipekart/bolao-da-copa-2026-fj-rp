# Correção do Ranking Geral

## Causa raiz

A view `public.v_ranking` é `security_invoker=true` e começa por `FROM profiles p`. A RLS de `profiles` para usuários autenticados permite SELECT apenas em `auth.uid() = id` (ou admin). Resultado: para qualquer usuário não-admin, `select * from v_ranking` devolve apenas a própria linha — por isso o Geral "não aparece para todos", enquanto os parciais funcionam (eles usam a RPC `get_public_profiles()` SECURITY DEFINER, que ignora a RLS de `profiles`).

## Princípio da correção

Não mexer em `profiles` (a RLS restritiva é desejada — proteção de PII) nem na infraestrutura dos parciais. Expor o Ranking Geral pela mesma porta que os parciais usam: uma função SECURITY DEFINER que devolve apenas os campos públicos do ranking.

## Mudanças

### 1. Banco — nova RPC `get_general_ranking()`

```sql
CREATE OR REPLACE FUNCTION public.get_general_ranking()
RETURNS TABLE (
  user_id uuid,
  display_name text,
  points_matches integer,
  points_knockout integer,
  points_total integer,
  exact_hits integer,
  updated_at timestamptz,
  champion_team_name text,
  champion_flag_url text,
  top_scorer_name text,
  top_scorer_flag_url text,
  mvp_name text,
  mvp_flag_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.display_name,
    COALESCE(l.points_matches, 0),
    COALESCE(l.points_knockout, 0),
    COALESCE(l.points_total, 0),
    COALESCE(l.exact_hits, 0),
    COALESCE(l.updated_at, p.created_at),
    t_champ.name,
    t_champ.flag_url,
    ep_ts.player_name,
    t_ts.flag_url,
    ep_mvp.player_name,
    t_mvp.flag_url
  FROM profiles p
  LEFT JOIN leaderboard l ON l.user_id = p.id
  LEFT JOIN knockout_predictions kp ON kp.user_id = p.id AND kp.stage = 'CHAMPION'
  LEFT JOIN teams t_champ ON t_champ.id = kp.team_id
  LEFT JOIN extra_predictions ep_ts ON ep_ts.user_id = p.id AND ep_ts.category = 'top_scorer'
  LEFT JOIN teams t_ts ON t_ts.id = ep_ts.team_id
  LEFT JOIN extra_predictions ep_mvp ON ep_mvp.user_id = p.id AND ep_mvp.category = 'mvp'
  LEFT JOIN teams t_mvp ON t_mvp.id = ep_mvp.team_id
  WHERE p.approved = true;
$$;

GRANT EXECUTE ON FUNCTION public.get_general_ranking() TO authenticated;
```

A view `v_ranking` pode ser mantida (não vou removê-la para não quebrar nada que eventualmente dependa dela em outro lugar).

### 2. Frontend — `src/hooks/useRanking.ts`

Trocar a única linha de leitura:

```ts
const { data, error } = await supabase.rpc('get_general_ranking');
```

A interface `RankingEntry` já bate com as colunas retornadas pela função. Nada mais muda — `RankingPage.tsx` e o restante seguem iguais.

## Validação

- Logar como usuário comum (não-admin) e abrir a aba "Geral": deve listar todos os participantes aprovados.
- Conferir que os outros rankings (Grupos / Rounds / Knockout / Custom) continuam idênticos.
