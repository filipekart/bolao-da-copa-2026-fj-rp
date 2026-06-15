## Objetivo

Em todas as abas de Ranking exceto "Geral", cada usuário aparece em uma única linha enxuta: posição, nome (truncate), badge PE, pontos. Sem dropdown, sem bandeiras de campeão/artilheiro/MVP, sem linha secundária.

Abas afetadas: Fase de Grupos, Rodada 1, Rodada 2, Rodada 3, 2ª Fase (knockout), Meus Rankings.
Aba "Geral" permanece como está (colapsável com extras + placares exatos).

## Mudanças

### `src/pages/RankingPage.tsx` — `RankingList` (branch não-colapsável)
Substituir o card de duas linhas pela mesma estrutura visual da linha compacta usada na aba Geral, mas sem o `ChevronDown` e sem `onClick` de expandir:

```text
[pos]  [nome ...you]                 [PE: N]   [pontos]
```

- Remover do branch não-colapsável: bandeira do campeão, artilheiro, MVP, segunda linha de stats.
- Manter: ref `isMe`, ring do "eu", busca, botão "Encontre-me", ordenação e posições atuais.
- Como nenhuma aba não-colapsável precisa mais de extras, podemos parar de chamar `mergeExtras(...)` nessas abas (passar `groupRanking`, `round1`, etc. direto). Mantém `extrasRevealed` no props apenas para compatibilidade, mas não é mais usado dentro do branch não-colapsável.

### `src/components/ranking/CustomRankingsTab.tsx`
Aplicar o mesmo layout compacto na lista de membros de cada ranking personalizado:
- Remover bandeira de campeão, artilheiro, MVP e linha secundária `ranking.exact: N`.
- Renderizar uma linha única: posição, nome (truncate, `(você)` quando `isMe`), badge `PE: N`, pontos em destaque (gradient gold).
- Manter ordenação, posições com tiebreaker, busca e demais controles existentes.

## Detalhes técnicos

- Reutilizar exatamente as classes da linha compacta atual (bloco `if (collapsible)` em `RankingList`) para garantir consistência visual entre Geral e as demais abas.
- Badge PE: `text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground`.
- Pontos: `text-lg font-display font-bold text-gradient-gold`.
- Nada de mudanças em hooks, RPCs ou i18n.
