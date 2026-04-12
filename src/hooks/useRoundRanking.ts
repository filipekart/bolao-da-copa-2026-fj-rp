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

export function useRoundRanking(round: 'round1' | 'round2' | 'round3' | 'knockout', enabled = true) {
  return useQuery({
    queryKey: ['round-ranking', round],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const params = round === 'knockout'
        ? { p_knockout: true }
        : ROUND_PARAMS[round];

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

      return result.sort((a, b) => b.round_points - a.round_points);
    },
  });
}
