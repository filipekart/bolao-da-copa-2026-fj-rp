Reverter a aba **Chave** (2a Fase) de volta a uma lista vertical de cards, conforme a foto de referência.

### Problema
A IA alterou recentemente o layout da aba Chave para usar `grid grid-cols-1 sm:grid-cols-2 gap-2`, fazendo com que em telas maiores os cards ficassem lado a lado (2 colunas). O usuário quer que volte a ser uma lista empilhada verticalmente, como na foto.

### Alteração
**Arquivo:** `src/pages/KnockoutPage.tsx` (linhas ~440-468)

- Trocar o container interno da lista de jogos de:
  ```
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
  ```
  para:
  ```
  <div className="space-y-2">
  ```

- Manter todo o resto: `BracketMatchCard` com layout horizontal interno (time A + placar + time B), inputs inline, alerta de prorrogação, e abas Classificação/Chave.

### O que não muda
- O card interno continua horizontal (time à esquerda, placar no meio, time à direita).
- Os palpites inline (± botões) permanecem.
- A aba Classificação permanece inalterada.
- O alerta sobre "90 min + prorrogação" permanece no topo.