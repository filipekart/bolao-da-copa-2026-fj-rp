
## Plano: Remover header "BOLÃO FJ | RP"

Apagar o `<h1>` "BOLÃO FJ | RP" do `AppLayout`, mantendo o `ThemeToggle` alinhado à direita.

**Alteração em `src/components/AppLayout.tsx`**
- Remover o `<h1>` do header row.
- Trocar `justify-between` por `justify-end` para o `ThemeToggle` ficar à direita.

Sem mudanças em outros arquivos. Banner de "Atuando como" e demais elementos do header permanecem.
