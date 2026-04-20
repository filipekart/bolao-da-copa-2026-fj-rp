

## Corrigir exemplo "Apenas resultado certo" nas Regras

### Problema
Em `src/components/RulesModal.tsx`, o exemplo da regra de 10 pts está incorreto: `Palpite 1×0, Real 2×0` acerta vencedor + gols do perdedor (0), o que vale 12 pts, não 10.

### Alteração
Em `src/components/RulesModal.tsx`, no array `matchRules`, trocar o exemplo de "Apenas resultado certo":

- De: `'Palpite 1×0, Real 2×0'`
- Para: `'Palpite 2×1, Real 3×0'`

Acerta só o vencedor; erra os gols do vencedor (2≠3) e do perdedor (1≠0) → 10 pts.

### Arquivos
- `src/components/RulesModal.tsx`

