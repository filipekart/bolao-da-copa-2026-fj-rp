export interface PredictedMatch {
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
}

export interface TeamStanding {
  teamId: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export function calculatePredictedStandings(matches: PredictedMatch[]): TeamStanding[] {
  const stats = new Map<string, TeamStanding>();

  const getOrCreate = (id: string): TeamStanding => {
    if (!stats.has(id)) {
      stats.set(id, {
        teamId: id,
        played: 0, wins: 0, draws: 0, losses: 0,
        goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0,
      });
    }
    return stats.get(id)!;
  };

  for (const m of matches) {
    const home = getOrCreate(m.homeTeamId);
    const away = getOrCreate(m.awayTeamId);

    home.played++;
    away.played++;
    home.goalsFor += m.homeScore;
    home.goalsAgainst += m.awayScore;
    away.goalsFor += m.awayScore;
    away.goalsAgainst += m.homeScore;

    if (m.homeScore > m.awayScore) {
      home.wins++; away.losses++;
      home.points += 3;
    } else if (m.homeScore < m.awayScore) {
      away.wins++; home.losses++;
      away.points += 3;
    } else {
      home.draws++; away.draws++;
      home.points++; away.points++;
    }

    home.goalDifference = home.goalsFor - home.goalsAgainst;
    away.goalDifference = away.goalsFor - away.goalsAgainst;
  }

  return Array.from(stats.values()).sort(
    (a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor
  );
}

/**
 * Given all group standings, determine the 32 teams that qualify for the knockout round.
 * Top 2 from each group (24 teams) + 8 best 3rd-placed teams = 32 teams.
 */
export function deriveQualifiedTeams(
  groupStandings: Map<string, TeamStanding[]>
): string[] {
  const qualified: string[] = [];
  const thirdPlaced: TeamStanding[] = [];

  for (const [, standings] of groupStandings) {
    if (standings.length < 3) continue;
    // Top 2 qualify directly
    qualified.push(standings[0].teamId);
    qualified.push(standings[1].teamId);
    // 3rd place is a candidate
    thirdPlaced.push(standings[2]);
  }

  // Sort 3rd-placed teams by FIFA criteria: points, GD, GF
  thirdPlaced.sort(
    (a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor
  );

  // Top 8 best 3rd-placed teams qualify
  const bestThird = thirdPlaced.slice(0, 8);
  qualified.push(...bestThird.map(t => t.teamId));

  return qualified;
}
