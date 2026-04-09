import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RoundRankingEntry {
  user_id: string;
  display_name: string;
  round_points: number;
  exact_hits: number;
}

type RoundFilter =
  | { type: 'match_number'; min: number; max: number }
  | { type: 'knockout' };

const ROUND_FILTERS: Record<string, RoundFilter> = {
  round1: { type: 'match_number', min: 1, max: 24 },
  round2: { type: 'match_number', min: 25, max: 48 },
  round3: { type: 'match_number', min: 49, max: 72 },
  knockout: { type: 'knockout' },
};

export function useRoundRanking(round: 'round1' | 'round2' | 'round3' | 'knockout', enabled = true) {
  const filter = ROUND_FILTERS[round];

  return useQuery({
    queryKey: ['round-ranking', round],
    enabled,
    staleTime: 5 * 60 * 1000, // 5 min
    queryFn: async () => {
      let query = supabase
        .from('match_predictions')
        .select('user_id, points_awarded, rule_applied, matches!inner(stage, match_number)');

      if (filter.type === 'match_number') {
        query = query
          .gte('matches.match_number', filter.min)
          .lte('matches.match_number', filter.max);
      } else {
        query = query.neq('matches.stage', 'GROUP_STAGE');
      }

      // Fetch predictions and profiles in parallel
      const [predRes, profRes] = await Promise.all([
        query,
        supabase.rpc('get_public_profiles'),
      ]);

      if (predRes.error) throw predRes.error;
      if (profRes.error) throw profRes.error;

      const userMap = new Map<string, { points: number; exact: number }>();
      (predRes.data ?? []).forEach((p: any) => {
        const existing = userMap.get(p.user_id) || { points: 0, exact: 0 };
        existing.points += p.points_awarded ?? 0;
        if (p.rule_applied === 'EXACT_SCORE') existing.exact += 1;
        userMap.set(p.user_id, existing);
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
