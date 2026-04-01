import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GroupRankingEntry {
  user_id: string;
  display_name: string;
  group_points: number;
  exact_hits: number;
}

export function useGroupRanking() {
  return useQuery({
    queryKey: ['group-ranking'],
    queryFn: async () => {
      // Get all match predictions joined with matches that are GROUP_STAGE
      const { data: predictions, error: predError } = await supabase
        .from('match_predictions')
        .select('user_id, points_awarded, rule_applied, matches!inner(stage)')
        .eq('matches.stage', 'GROUP_STAGE');

      if (predError) throw predError;

      // Get profiles for display names (using secure function that excludes pix_key)
      const { data: profiles, error: profError } = await supabase
        .rpc('get_public_profiles');

      if (profError) throw profError;

      const profileMap = new Map(profiles?.map(p => [p.id, p.display_name]) ?? []);

      // Aggregate per user
      const userMap = new Map<string, { points: number; exact: number }>();
      (predictions ?? []).forEach((p: any) => {
        const existing = userMap.get(p.user_id) || { points: 0, exact: 0 };
        existing.points += p.points_awarded ?? 0;
        if (p.rule_applied === 'EXACT_SCORE') existing.exact += 1;
        userMap.set(p.user_id, existing);
      });

      // Include only approved profiles
      const result: GroupRankingEntry[] = (profiles ?? [])
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
