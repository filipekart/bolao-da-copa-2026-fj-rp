import { type MatchWithTeams } from "@/hooks/useMatches";

/** True from kickoff until 5 hours after kickoff */
export function isMatchRevealed(match: MatchWithTeams): boolean {
  const now = Date.now();
  const kickoff = new Date(match.kickoff_at).getTime();
  return now >= kickoff && now <= kickoff + 5 * 60 * 60 * 1000;
}

/** True as soon as kickoff has passed (no upper bound) */
export function isMatchVisible(match: MatchWithTeams): boolean {
  return Date.now() >= new Date(match.kickoff_at).getTime();
}
