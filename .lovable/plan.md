

## Otimização: useMemo no sort do RankingList

### Problema
`sorted` é recalculado a cada render (ex: digitação na busca), desnecessariamente re-ordenando 300+ entradas.

### Mudança
**Arquivo:** `src/pages/RankingPage.tsx`

1. Adicionar `useMemo` ao import (linha 1)
2. Envolver o sort com `useMemo` (linha 50):
```tsx
const sorted = useMemo(
  () => [...ranking].sort((a, b) => (b[showField] ?? 0) - (a[showField] ?? 0)),
  [ranking, showField]
);
```

Dependências: `[ranking, showField]` — recalcula apenas quando os dados ou a tab mudam, não quando o usuário digita na busca.

### Impacto
- Elimina re-sorts redundantes durante digitação de busca e outros re-renders
- Melhoria proporcional ao número de usuários (300+)

