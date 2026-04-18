
Implementar desempate por número de placares exatos (`exact_hits`) em todos os rankings.

## Mudanças

**Arquivo único:** `src/pages/RankingPage.tsx`

Atualizar a função `sorted` no componente `RankingList` para incluir desempate:

```ts
const sorted = useMemo(
  () => ranking?.length
    ? [...ranking].sort((a, b) => {
        const pointsDiff = (b[showField] ?? 0) - (a[showField] ?? 0);
        if (pointsDiff !== 0) return pointsDiff;
        return (b.exact_hits ?? 0) - (a.exact_hits ?? 0);
      })
    : [],
  [ranking, showField]
);
```

Como o `RankingList` é usado por todas as abas (Geral, Grupos, Round 1/2/3, Knockout), a regra se aplica automaticamente a todos os rankings.

## Observações

- A aba "Custom Rankings" (`CustomRankingsTab`) precisa ser verificada — se ela usar a mesma lógica de ordenação interna, aplicaremos a mesma regra lá também.
- Atualizar a memória `mem://features/ranking-details` para refletir a nova regra de desempate (substituindo "alfabética" por "placares exatos").
