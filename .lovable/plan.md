## Objetivo

Reduzir a superfície de ataque das funções `SECURITY DEFINER` revogando `EXECUTE` de quem não precisa chamá-las e blindando as duas funções administrativas que hoje não validam o papel internamente.

## Diagnóstico

Auditei as 20 funções `SECURITY DEFINER` do schema `public` e cruzei com o uso real no app/edge functions:

**Categoria A — chamadas legítimas por usuários autenticados (manter EXECUTE para `authenticated`, revogar de `anon`/`public`):**
- `submit_match_prediction`, `submit_champion_prediction`, `submit_extra_prediction`
- `get_public_profiles`, `get_official_extras`, `get_round_ranking`

**Categoria B — admin-only (já validam `has_role` internamente; manter `authenticated`, revogar de `anon`/`public`):**
- `admin_set_champion`, `admin_clear_champion`, `admin_set_extra_result`, `admin_clear_extra_result`

**Categoria C — uso só em RLS / outras funções / triggers (revogar de `anon`, `authenticated` e `public`):**
- `has_role`, `is_match_open`, `is_tournament_open`, `is_knockout_stage_open`
- `is_ranking_owner`, `is_ranking_member`
- `handle_new_user` (trigger), `get_extras_completion` (só edge function com service_role)

**Categoria D — sensíveis, hoje chamáveis sem checagem:**
- `score_finished_matches` e `refresh_leaderboard` são invocadas pelo `useAdmin` no client, mas não validam `has_role` por dentro. Qualquer autenticado pode disparar recálculo do leaderboard.

> Observação: `calculate_match_prediction_points` e `get_result_label` são `IMMUTABLE` sem `SECURITY DEFINER` real relevante — vou revogar do `public` por consistência.

## Plano

1. **Migration única** que:
   - Adiciona checagem `has_role(auth.uid(),'admin')` no topo de `score_finished_matches()` e `refresh_leaderboard()` (defesa em profundidade, já que admins continuam chamando via `useAdmin`).
   - `REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated` em todas as funções da Categoria C.
   - `REVOKE EXECUTE ... FROM PUBLIC, anon` nas Categorias A e B (mantém `authenticated`).
   - Mantém `service_role` com `EXECUTE` em tudo (edge functions continuam funcionando: `fetch-fifa-results`, `send-push-reminders`, `export-match-predictions`).

2. **Sem mudanças de frontend.** Todas as chamadas atuais continuam válidas:
   - Cliente segue chamando `submit_*`, `get_public_profiles`, `get_official_extras`, `get_round_ranking`, `admin_*` (admins são `authenticated`).
   - `useAdmin` continua chamando `score_finished_matches`/`refresh_leaderboard` — agora protegidas por `has_role`.
   - RLS continua funcionando porque políticas executam as funções no contexto do owner (postgres), não do role chamador.

3. **Validação pós-migration**: rodar `supabase--linter` e confirmar que o aviso `SUPA_authenticated_security_definer_function_executable` desapareceu para a Categoria C e que o app continua funcional (submissão de palpite, ranking, admin).

## O que NÃO faz parte

- Não mexo nos achados separados de Realtime/pix_key, view SECURITY DEFINER e bucket `match-exports` — esses são tickets distintos.
