Reestruturar o `BracketMatchCard` em `src/pages/KnockoutPage.tsx` para **layout vertical** — resolve o truncamento mesmo em telas estreitas (390px).

## Estrutura nova

```
┌──────────────────────────────────────┐
│ Jogo 75              📅 29 jun 22:00 │
├──────────────────────────────────────┤
│   🇿🇦  África do Sul                 │
│        2º Grupo A                    │
│                                      │
│        [−] 0 [+]  ×  [−] 1 [+]       │
│                                      │
│   🇨🇦  Canadá                        │
│        2º Grupo B                    │
├──────────────────────────────────────┤
│ Detalhes / quem avança →     ✓ Salvo │
└──────────────────────────────────────┘
```

## Mudanças
- Header (Jogo nº + data) e footer (link Detalhes + Salvo) inalterados.
- Bloco central vira coluna: linha do mandante (bandeira + nome completo + label "1º Grupo X" abaixo), linha do placar centralizada, linha do visitante.
- Remover `truncate` e `max-w-[80px]`; nomes em `text-sm font-semibold` em linha única natural (cabem completos com a largura total disponível).
- Inputs −/+ mantidos com os mesmos botões e a mesma lógica de auto-save, lock, FINISHED e estados de loading/Salvo.
- Sem alteração em RPC, i18n, hooks ou outras telas.