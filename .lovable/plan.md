## Objetivo
Trocar a numeração de posição do ranking (atualmente `idx + 1`) por "standard competition ranking" (1,1,1,4). Empate definido apenas por pontos + exact_hits. Ordenação visual intacta. Sem mexer em RPCs nem banco.

## Implementação

### 1. Criar helper único
Novo arquivo `src/lib/rankingPositions.ts`:

```ts
// Recebe lista JÁ ordenada e os campos que definem empate.
// Retorna array paralelo de posições (1,1,1,4,...).
export function computePositions<T>(
  rows: T[],
  tieKeys: (keyof T)[]
): number[] {
  const positions: number[] = [];
  rows.forEach((row, idx) => {
    if (idx === 0) {
      positions.push(1);
      return;
    }
    const prev = rows[idx - 1];
    const tied = tieKeys.every(k => (row[k] ?? 0) === (prev[k] ?? 0));
    positions.push(tied ? positions[idx - 1] : idx + 1);
  });
  return positions;
}
```

### 2. `src/pages/RankingPage.tsx` — `RankingList`
- Manter o `sorted` (ordem: `showField` DESC → `exact_hits` DESC → `display_name` ASC).
- Calcular `positions = computePositions(sorted, [showField, 'exact_hits'])` — onde `showField` é `points_total`, `group_points` ou `round_points` conforme a aba.
- Substituir o atual `idx + 1` (tanto no branch com busca quanto no sem) por `positions[idx]`.
- O badge dourado/medalha continua reagindo ao número exibido (`position === 1/2/3`), então o estilo de empates segue natural (três "1" recebem badge gold).

### 3. `src/components/ranking/CustomRankingsTab.tsx` — `FilteredRankingList`
- Manter o `.filter(...).sort(...)` atual (filtra antes de ordenar).
- Calcular `positions = computePositions(filtered, ['points_total', 'exact_hits'])` SOBRE a lista já filtrada — posição é relativa ao grupo exibido.
- Substituir `idx + 1` por `positions[idx]`.

### 4. Campo de empate por aba
| Aba | Campo de pontos (já é o `showField`) | tieKeys |
|---|---|---|
| Geral | `points_total` | `['points_total','exact_hits']` |
| Grupos | `group_points` | `['group_points','exact_hits']` |
| Rodadas 1/2/3 | `round_points` | `['round_points','exact_hits']` |
| Mata-mata | `round_points` | `['round_points','exact_hits']` |
| Custom | `points_total` | `['points_total','exact_hits']` |

Basta passar `[showField, 'exact_hits']` em `RankingList`.

## Não será alterado
- RPCs `get_general_ranking`, `get_round_ranking`, `get_group_ranking`.
- Critérios de ordenação (alfabético continua só como desempate visual).
- Estilo das medalhas (1º/2º/3º) — herda naturalmente do número calculado.
- Nenhuma migration, nenhuma alteração em `leaderboard`.

## Verificação (após implementar)
- Caso 3 empatados no topo (mesmos pontos e exact_hits): exibe 1,1,1,4.
- Caso empate no meio (ex.: posições 5,5,7): exibe 5,5,7 corretamente.
- Dois usuários com mesmos pontos mas exact_hits diferentes: posições distintas (não empatam).
- Custom ranking com 5 membros filtrados: numeração 1..N relativa ao grupo, não ao geral.
