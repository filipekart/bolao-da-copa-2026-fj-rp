## Objetivo

Na aba **Jogos** (HomePage), dentro de cada grupo expandido, os jogos já encerrados aparecem hoje apenas com o **palpite** do usuário e um cadeado. O placar real não é mostrado, o que dificulta lembrar resultados ao palpitar nas rodadas seguintes do mesmo grupo.

## Sugestão (sem adicionar linha)

Reaproveitar a mesma linha do `MatchRow` no estado `locked`. Quando o jogo estiver `FINISHED` (com `official_home_score`/`official_away_score`), exibir o **placar oficial em destaque** e o **palpite do usuário menor entre parênteses**, tudo na mesma linha:

```text
Brasil  (2×1) 3 × 0 🔒  Sérvia
```

- `3 × 0` → placar oficial, fonte bold, cor `text-primary` (dourado), nos mesmos boxes onde hoje aparece o palpite.
- `(2×1)` → palpite do usuário, fonte menor (`text-[10px] text-muted-foreground`), à esquerda dos boxes.
- Cadeado permanece à direita, como hoje.
- Se o usuário não palpitou, mostra só o placar oficial (sem parênteses).
- Para jogos só travados (kickoff passou) mas ainda não finalizados, comportamento atual continua igual (mostra só o palpite + cadeado).

Vantagens:
- Zero linha nova; mesma altura visual da linha.
- O placar real fica em destaque (dourado), batendo com o padrão da `MatchCard` da aba Jogos.
- O palpite continua visível para conferência rápida.

## Onde mexer

Apenas `src/components/MatchCard.tsx`? Não — é `src/pages/HomePage.tsx`, componente `MatchRow`, ramo `locked` (linhas ~63-73). Adicionar:

1. Detectar `isFinished = match.status === 'FINISHED' && official_home_score != null && official_away_score != null`.
2. Se `isFinished`:
   - Renderizar pequeno texto `(palpiteHome×palpiteAway)` à esquerda dos boxes (apenas se houver palpite).
   - Trocar o conteúdo dos boxes para `official_home_score` e `official_away_score`, com classe `text-primary`.
3. Caso contrário, manter exatamente o layout atual.

Nenhuma alteração em hooks, RPC, RLS, i18n ou outras telas.

## Alternativas consideradas (descartadas)

- **Tooltip no cadeado** com o placar oficial → exige toque/hover, não ajuda em mobile.
- **Substituir palpite pelo placar oficial sem mostrar palpite** → perde a referência do que o usuário apostou.
- **Badge "+25" ao lado** → já existe na aba Palpites; aqui o foco é o placar real para apoiar próximos palpites.
