import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RoundRankingEntry {
  user_id: string;
  display_name: string;
  round_points: number;
  exact_hits: number;
}

const ROUND_PARAMS: Record<string, { p_min_match: number; p_max_match: number; p_knockout?: boolean }> = {
  round1: { p_min_match: 1, p_max_match: 24 },
  round2: { p_min_match: 25, p_max_match: 48 },
  round3: { p_min_match: 49, p_max_match: 72 },
};

export type KnockoutSubStage = 'all' | 'ROUND_OF_32' | 'ROUND_OF_16' | 'QUARTER_FINAL' | 'SEMI_FINAL' | 'FINAL_GROUP';

const KNOCKOUT_SUBSTAGE_RANGES: Record<KnockoutSubStage, { p_min_match: number; p_max_match: number } | null> = {
  all: null,
  ROUND_OF_32: { p_min_match: 73, p_max_match: 88 },
  ROUND_OF_16: { p_min_match: 89, p_max_match: 96 },
  QUARTER_FINAL: { p_min_match: 97, p_max_match: 100 },
  SEMI_FINAL: { p_min_match: 101, p_max_match: 102 },
  FINAL_GROUP: { p_min_match: 103, p_max_match: 104 },
};

export function useRoundRanking(
  round: 'round1' | 'round2' | 'round3' | 'knockout',
  enabled = true,
  subStage?: KnockoutSubStage,
) {
  return useQuery({
    queryKey: ['round-ranking', round, subStage ?? 'all'],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      let params: Record<string, any>;
      if (round === 'knockout') {
        const range = subStage ? KNOCKOUT_SUBSTAGE_RANGES[subStage] : null;
        if (range) {
          params = range;
        } else {
          params = { p_knockout: true };
        }
      } else {
        params = ROUND_PARAMS[round];
      }

      const [rankRes, profRes] = await Promise.all([
        supabase.rpc('get_round_ranking', params),
        supabase.rpc('get_public_profiles'),
      ]);

      if (rankRes.error) throw rankRes.error;
      if (profRes.error) throw profRes.error;

      const userMap = new Map<string, { points: number; exact: number }>();
      (rankRes.data ?? []).forEach((r: any) => {
        userMap.set(r.user_id, { points: Number(r.round_points), exact: Number(r.exact_hits) });
      });

      const result: RoundRankingEntry[] = (profRes.data ?? [])
        .filter((p: any) => p.approved)
        .map((p: any) => {
          const stats = userMap.get(p.id) || { points: 0, exact: 0 };
          return {
            user_id: p.id,
            display_name: p.display_name,
            round_points: stats.points,
            exact_hits: stats.exact,
          };
        });

      return result.sort((a, b) => {
        const pointsDiff = b.round_points - a.round_points;
        if (pointsDiff !== 0) return pointsDiff;
        const exactDiff = b.exact_hits - a.exact_hits;
        if (exactDiff !== 0) return exactDiff;
        return (a.display_name ?? '').localeCompare(b.display_name ?? '', 'pt', { sensitivity: 'base' });
      });
    },
  });
}

