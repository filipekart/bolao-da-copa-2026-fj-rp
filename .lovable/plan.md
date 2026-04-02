

## Plano: Adicionar abas de ranking por rodada e 2ª fase

### Visão geral
Adicionar 4 novas abas ao ranking: **Rodada 1**, **Rodada 2**, **Rodada 3** (fase de grupos) e **2ª Fase** (knockout), totalizando 6 abas. A navegação usará um layout horizontal com scroll para acomodar todas.

### Como funciona

Cada rodada da fase de grupos tem 24 jogos (match_number 1-24, 25-48, 49-72). O ranking de cada rodada soma apenas os pontos dos palpites daqueles jogos. O ranking da 2ª fase soma pontos de jogos com stage diferente de GROUP_STAGE.

### Alterações

**1. Novo hook `src/hooks/useRoundRanking.ts`**
- Recebe um parâmetro `round` (1, 2 ou 3) ou `'knockout'`
- Filtra `match_predictions` por `match_number` range (rodadas) ou por `stage != GROUP_STAGE` (2ª fase)
- Agrega pontos e acertos exatos por usuário, igual ao `useGroupRanking`

**2. `src/pages/RankingPage.tsx`**
- Trocar `TabsList` de `grid-cols-2` para scroll horizontal (`flex overflow-x-auto`)
- Adicionar 4 novas abas: Rodada 1, Rodada 2, Rodada 3, 2ª Fase
- Cada aba usa o novo hook com o filtro apropriado
- Reutiliza o componente `RankingList` existente

**3. Traduções (`pt.json`, `en.json`, `es.json`, `fr.json`)**
- Adicionar chaves: `ranking.round1`, `ranking.round2`, `ranking.round3`, `ranking.knockout`

### Detalhes técnicos
- Rodada 1: match_number 1-24
- Rodada 2: match_number 25-48
- Rodada 3: match_number 49-72
- 2ª Fase: stage IN ('ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL')
- O hook genérico evita duplicação de código
- Cada aba só busca dados quando ativada (lazy loading via `enabled` no useQuery ou renderização condicional)

