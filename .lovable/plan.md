## Objetivo

Na aba **Jogos → Classificação prevista** (HomePage, dentro do `GroupCard`), trocar a fonte dos placares usados para montar a tabela do grupo:

- Se a partida está finalizada (`status === 'FINISHED'` e tem `official_home_score` / `official_away_score`): usar o **placar oficial**.
- Caso contrário (jogo futuro/ao vivo/sem placar oficial): usar o **palpite atual do usuário**, exatamente como hoje.
- Se não houver nem placar oficial nem palpite preenchido: a partida é ignorada na conta (comportamento atual).

Sem indicador visual — a tabela simplesmente reflete a realidade conforme os jogos vão acontecendo.

## Alteração

Arquivo único: `src/pages/HomePage.tsx`, função `GroupCard` (linhas ~217–229).

Substituir o bloco que monta `predictedMatches` por uma versão que prioriza o placar oficial:

```ts
const predictedMatches: PredictedMatch[] = matches
  .map(m => {
    const isFinished =
      m.status === 'FINISHED' &&
      m.official_home_score !== null &&
      m.official_away_score !== null;

    if (isFinished) {
      return {
        homeTeamId: m.home_team_id,
        awayTeamId: m.away_team_id,
        homeScore: m.official_home_score as number,
        awayScore: m.official_away_score as number,
      };
    }

    const s = scores[m.id];
    if (s && s.home !== null && s.away !== null) {
      return {
        homeTeamId: m.home_team_id,
        awayTeamId: m.away_team_id,
        homeScore: s.home as number,
        awayScore: s.away as number,
      };
    }

    return null;
  })
  .filter((x): x is PredictedMatch => x !== null);

const standings = calculatePredictedStandings(predictedMatches);
```

Nada mais muda: `calculatePredictedStandings`, ordenação, render da tabela, contador "X de Y jogos com palpite" continuam iguais.

## Fora de escopo

- KnockoutPage (linhas ~511–525): mantém-se como está (mata-mata ainda não começou; mesmo modelo pode ser aplicado depois se necessário).
- Sem mudança de UI, tradução, ou tokens de design.
- Sem mudança no backend / RLS / RPC.

## Verificação

- Build TS passa (mudança trivial de tipos).
- Conferir visualmente um grupo com jogo já finalizado: a linha dos times deve refletir o placar real, não o palpite.
