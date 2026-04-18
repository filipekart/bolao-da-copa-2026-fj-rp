
Vou aplicar uma versão "dark mode moderno" mais clara e tirar um screenshot para comparação antes/depois.

## O que vou alterar

**1. `src/index.css` — Ajustar variáveis de cor**

Mudar o fundo de `hsl(220 20% 7%)` (~`#0a0a1a`, quase preto) para `hsl(222 47% 11%)` (~`#0f172a`, azul-acinzentado escuro tipo Twitter/X/Discord).

Ajustar variáveis relacionadas:
- `--background: 220 20% 7%` → `222 47% 11%`
- `--card: 220 18% 11%` → `222 47% 14%`
- `--popover: 220 18% 11%` → `222 47% 14%`
- `--secondary: 220 15% 18%` → `222 47% 16%`
- `--muted: 220 15% 15%` → `222 47% 18%`
- `--surface: 220 18% 13%` → `222 47% 20%`
- `--sidebar-background: 220 18% 9%` → `222 47% 10%`

Mantém o verde primário e dourado de destaque — só clareia o fundo para reduzir o peso visual.

**2. Preview e screenshot**

Após aplicar, tiro screenshot da mesma tela para comparação lado a lado.

**Resultado esperado**: Fundo azul-acinzentado (`#0f172a`) em vez de quase-preto (`#0a0a1a`). Mesmo dark mode, mas mais "respiro" visual.
