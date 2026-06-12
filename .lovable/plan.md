# Reestruturar Palpites em 3 abas

Refatorar `src/pages/MyBetsPage.tsx` para organizar os palpites em três abas, priorizando o próximo jogo e tirando os finalizados do caminho.

## Estrutura

**Abas (shadcn `Tabs`) no topo, abaixo do título:**

| Aba | Critério | Ordenação | Default |
|---|---|---|---|
| Próximos | `kickoff_at > agora + 24h` OU sem kickoff ainda | data crescente | — |
| Hoje / Ao vivo | jogo em andamento (kickoff passou e não finalizado) **ou** kickoff nas próximas 24h | horário crescente | ✅ aba inicial se tiver conteúdo, senão cai em Próximos |
| Finalizados | `status = 'FINISHED'` | data **decrescente** | — |

A contagem de cada aba aparece como badge no trigger (ex: "Próximos · 48").

## Comportamentos por aba

**Próximos**
- Mantém agrupamento por fase (Grupo A-L, Oitavas, Quartas, etc.) — usa `match.stage` em vez de só `group_name`, pra mata-mata ficar organizado.
- O **primeiro card** (próximo jogo cronológico) ganha destaque: borda dourada (`ring-1 ring-primary`, mesmo padrão de "match visibility" já usado no projeto) e um contador "em 2h 15min" (cálculo em JS, atualizado a cada 60s via `useEffect`).

**Hoje / Ao vivo**
- Cards em destaque, sem agrupamento (lista curta).
- Badge "AO VIVO" pulsante nos que já iniciaram e ainda não finalizaram.

**Finalizados**
- Agrupamento por fase, mas ordem decrescente (fase mais recente primeiro, jogos mais recentes no topo dentro de cada fase).
- Filtros em chips acima da lista (multi-select, OR):
  - Acertou em cheio (`EXACT_SCORE`)
  - Acertou parcial (`WINNER_AND_WINNER_GOALS`, `WINNER_AND_LOSER_GOALS`, `DRAW_RESULT_ONLY`, `RESULT_ONLY`)
  - Errou (`MISS`)
  - Sem palpite (sem registro em `match_predictions`) — **fora do escopo desta entrega** porque `useMyPredictions` só retorna palpites existentes; deixar como melhoria futura.

## Busca

Busca atual (por nome de time) fica visível nas 3 abas. Estender para aceitar placar (`2x1`, `2-1`, `2:1`) usando a mesma heurística do `MatchPredictionsList` (regex de dígitos), comparando contra placar oficial (finalizados) ou predicted (próximos).

## Estado vazio

Cada aba tem mensagem própria:
- Próximos: "Nenhum jogo pendente — você está em dia! 🎯"
- Hoje: "Nenhum jogo nas próximas 24h"
- Finalizados: "Nenhum jogo finalizado ainda"

## Persistência

Aba ativa salva em `localStorage` (`bets-active-tab`) para manter contexto entre visitas.

## Detalhes técnicos

- Arquivo único: `src/pages/MyBetsPage.tsx` (refator). Sem mudanças de hook/RPC/backend.
- Componentes shadcn já disponíveis: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`, `Badge`.
- i18n: adicionar chaves em `src/i18n/locales/{pt,en,es,fr}.json` (`bets.tabs.upcoming`, `bets.tabs.today`, `bets.tabs.finished`, `bets.empty.upcoming`, etc.).
- Sem alterações em RLS, edge functions ou migrations.
- Sem alterações em outras páginas.

## Fora do escopo

- "Sem palpite" como filtro (requer nova query cruzando `matches` × `match_predictions`).
- Notificações ou contagem regressiva push.
- Mudanças visuais no card individual além do destaque do próximo jogo.
