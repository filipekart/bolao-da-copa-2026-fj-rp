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
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const [rankRes, profRes] = await Promise.all([
        supabase.rpc('get_round_ranking', {}),
        supabase.rpc('get_public_profiles'),
      ]);

      if (rankRes.error) throw rankRes.error;
      if (profRes.error) throw profRes.error;

      const userMap = new Map<string, { points: number; exact: number }>();
      (rankRes.data ?? []).forEach((r: any) => {
        userMap.set(r.user_id, { points: Number(r.round_points), exact: Number(r.exact_hits) });
      });

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
