import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RoundRankingEntry {
  user_id: string;
  display_name: string;
  round_points: number;
  exact_hits: number;
}

const ROUND_PARAMS: Record<string, { p_min_match: number; p_max_match: number }> = {
  round1: { p_min_match: 1, p_max_match: 24 },
  round2: { p_min_match: 25, p_max_match: 48 },
  round3: { p_min_match: 49, p_max_match: 72 },
};

export function useRoundRanking(
  round: 'round1' | 'round2' | 'round3' | 'knockout',
  enabled = true,
) {
  return useQuery({
    queryKey: ['round-ranking', round],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const params = round === 'knockout'
        ? { p_min_match: 73, p_max_match: 104 }
        : ROUND_PARAMS[round];

      const [rankRes, profRes, lbRes] = await Promise.all([
        supabase.rpc('get_round_ranking', params),
        supabase.rpc('get_public_profiles'),
        round === 'knockout'
          ? supabase.from('leaderboard').select('user_id, points_knockout')
          : Promise.resolve({ data: [], error: null } as any),
      ]);

      if (rankRes.error) throw rankRes.error;
      if (profRes.error) throw profRes.error;
      if ((lbRes as any).error) throw (lbRes as any).error;

      const userMap = new Map<string, { points: number; exact: number }>();
      (rankRes.data ?? []).forEach((r: any) => {
        userMap.set(r.user_id, { points: Number(r.round_points), exact: Number(r.exact_hits) });
      });

      const extrasMap = new Map<string, number>();
      if (round === 'knockout') {
        ((lbRes as any).data ?? []).forEach((r: any) => {
          extrasMap.set(r.user_id, Number(r.points_knockout) || 0);
        });
      }

      const result: RoundRankingEntry[] = (profRes.data ?? [])
        .filter((p: any) => p.approved)
        .map((p: any) => {
          const stats = userMap.get(p.id) || { points: 0, exact: 0 };
          const extras = extrasMap.get(p.id) ?? 0;
          return {
            user_id: p.id,
            display_name: p.display_name,
            round_points: stats.points + extras,
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


