## Problema

A aba **Ranking → 2ª Fase** hoje só soma os pontos de palpites de partidas do mata-mata (jogos 73–104) via a RPC `get_round_ranking`. Ela **não inclui** os pontos de extras:

- Campeão: 100 pts
- Artilheiro: 50 pts
- MVP: 50 pts

Esses extras já são calculados corretamente em `refresh_leaderboard` no campo `points_knockout` da tabela `leaderboard`, e aparecem no ranking Geral — mas a aba 2ª Fase não usa esse valor.

## Correção proposta

No hook `src/hooks/useRoundRanking.ts`, quando `round === 'knockout'`, somar `points_knockout` do leaderboard (que já contém campeão + artilheiro + MVP) aos pontos dos jogos do mata-mata retornados pela RPC.

Fluxo:

1. Buscar em paralelo: `get_round_ranking` (jogos 73–104), `get_public_profiles` e agora também a tabela `leaderboard` (campos `user_id`, `points_knockout`).
2. Para a aba `knockout`, montar `round_points = (pontos dos jogos KO) + (points_knockout do leaderboard)`.
3. Manter `exact_hits` como está (só placares exatos de partidas — extras não contam como PE).
4. Rodadas 1/2/3 e Fase de Grupos ficam inalteradas.

Ordenação e desempate seguem o mesmo padrão (pontos → PE → alfabético).

## Impacto

- Único arquivo alterado: `src/hooks/useRoundRanking.ts`.
- Sem migrations, sem mudança em RPC, sem mudança de UI.
- A aba 2ª Fase passa a mostrar a soma correta assim que os extras forem revelados/pontuados.

## Observação

Os extras (campeão/artilheiro/MVP) só entram em `points_knockout` depois que o admin registra o resultado oficial (`admin_set_champion` / `admin_set_extra_result`). Antes disso, o valor é 0 e nada muda visualmente — o comportamento é o mesmo do ranking Geral.
