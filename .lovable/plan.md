## Trocar botões +/− por setas compactas na aba 2a Fase

### Contexto
Na aba **Chaveamento** (2a Fase), o `BracketMatchCard` exibe controles de placar com botões `−` e `+` horizontais (`w-6 h-6` cada) ao redor de cada número. Isso ocupa bastante largura, especialmente em mobile.

### Objetivo
Reduzir a largura horizontal dos controles de placar, substituindo os botões `−`/`+` por setas para cima/baixo empilhadas verticalmente ao lado do número.

### Alterações
1. **Importar ícones** no `KnockoutPage.tsx`: adicionar `ChevronUp` e `ChevronDown` do `lucide-react`.
2. **Refatorar o input de placar** dentro do `BracketMatchCard`:
   - Para cada time (home e away), criar um bloco vertical compacto:
     - `ChevronUp` (botão pequeno, ~w-5 h-3) acima do número.
     - O número centralizado (mesmo w-5).
     - `ChevronDown` (botão pequeno, ~w-5 h-3) abaixo do número.
   - Isso reduz a largura de ~`w-6 + w-5 + w-6 = 17` para ~`w-5 = 5` por time.
3. **Ajustar espaçamento** entre os dois blocos (home × away) e o separador `×` para não ficar apertado demais.
4. **Manter comportamentos** existentes: debounce de 700ms, indicador "Salvo", bloqueio quando `isLocked`, sincronização com `existingPrediction`, e `stopPropagation` para não abrir o card ao clicar nas setas.

### Arquivos alterados
- `src/pages/KnockoutPage.tsx` — apenas o layout dos inputs dentro do `BracketMatchCard`.

### Resultado esperado
Controles de placar mais estreitos, liberando espaço horizontal para os nomes dos times na mesma linha.