import { type MatchWithTeams } from "@/hooks/useMatches";

/** True as soon as kickoff has passed */
export function isMatchRevealed(match: MatchWithTeams): boolean {
  return match.status === 'FINISHED' || Date.now() >= new Date(match.kickoff_at).getTime();
}

/** True as soon as kickoff has passed (no upper bound) */
export function isMatchVisible(match: MatchWithTeams): boolean {
  return Date.now() >= new Date(match.kickoff_at).getTime();
}
