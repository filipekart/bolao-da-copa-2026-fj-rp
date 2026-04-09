import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GroupRankingEntry {
  user_id: string;
  display_name: string;
  group_points: number;
  exact_hits: number;
}

export function useGroupRanking(enabled = true) {
  return useQuery({
    queryKey: ['group-ranking'],
    enabled,
    staleTime: 5 * 60 * 1000, // 5 min — rankings don't change frequently
    queryFn: async () => {
      // Fetch predictions and profiles in parallel
      const [predRes, profRes] = await Promise.all([
        supabase
          .from('match_predictions')
          .select('user_id, points_awarded, rule_applied, matches!inner(stage)')
          .eq('matches.stage', 'GROUP_STAGE'),
        supabase.rpc('get_public_profiles'),
      ]);

      if (predRes.error) throw predRes.error;
      if (profRes.error) throw profRes.error;

      // Aggregate per user
      const userMap = new Map<string, { points: number; exact: number }>();
      (predRes.data ?? []).forEach((p: any) => {
        const existing = userMap.get(p.user_id) || { points: 0, exact: 0 };
        existing.points += p.points_awarded ?? 0;
        if (p.rule_applied === 'EXACT_SCORE') existing.exact += 1;
        userMap.set(p.user_id, existing);
      });

      // Include only approved profiles
      const result: GroupRankingEntry[] = (profRes.data ?? [])
        .filter(p => p.approved)
        .map(p => {
          const stats = userMap.get(p.id) || { points: 0, exact: 0 };
          return {
            user_id: p.id,
            display_name: p.display_name,
            group_points: stats.points,
            exact_hits: stats.exact,
          };
        });

      return result.sort((a, b) => b.group_points - a.group_points);
    },
  });
}
