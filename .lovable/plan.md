## Objetivo
Na aba "Meus Rankings", permitir filtrar a pontuação dos membros por fase: Geral, Fase de Grupos, Rodada 1, Rodada 2, Rodada 3 e Mata-mata.

## Como funciona hoje
Cada ranking customizado, ao expandir, mostra apenas a pontuação **Geral** (`points_total`) dos membros, filtrando a lista global do hook `useRanking()`.

## Mudanças propostas

### 1. `CustomRankingsTab.tsx`
- Ao expandir um ranking, mostrar uma barra de chips/abas pequenas com as opções:
  - Geral (default)
  - Grupos
  - Rodada 1
  - Rodada 2
  - Rodada 3
  - Mata-mata
- Estado local `filterByRanking: Record<string, Phase>` para lembrar a escolha por card (independente entre rankings expandidos).
- Conforme a opção escolhida, buscar a fonte de pontuação correta:
  - Geral → `useRanking()` (já em uso), campo `points_total`
  - Grupos → `useGroupRanking()`, campo `group_points`
  - Rodada 1/2/3 e Mata-mata → `useRoundRanking('round1'|...|'knockout')`, campo `round_points`
- Hooks são chamados no nível do `CustomRankingsTab` (não dentro do map), todos sempre habilitados (cache de 5 min já existe). Alternativa: habilitar sob demanda via um set de fases ativas — fica como detalhe de implementação para evitar fetch desnecessário no carregamento inicial.

### 2. `FilteredRankingList`
- Aceitar props extras: `source` (array de pontuação da fase escolhida), `pointsField` (`points_total` | `group_points` | `round_points`).
- Usar `pointsField` na ordenação, no `computePositions` e na coluna de pontos exibida.
- Manter "PE" (acertos exatos) como hoje — cada hook já retorna `exact_hits` da fase correspondente.

### 3. i18n
- Reaproveitar chaves existentes em `ranking.*` (`general`, `groupStage`, `round1`, `round2`, `round3`, `knockout`) — nenhuma string nova necessária.

## Notas
- Mudança puramente de UI/apresentação: nenhuma alteração de schema, RPC ou RLS.
- O filtro só aparece dentro do card expandido, mantendo a listagem de rankings limpa.
