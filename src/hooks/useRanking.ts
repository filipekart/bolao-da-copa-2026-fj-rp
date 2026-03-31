import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RankingEntry {
  user_id: string;
  display_name: string;
  points_matches: number;
  points_knockout: number;
  points_total: number;
  exact_hits: number;
  updated_at: string;
  champion_team_name?: string | null;
  champion_flag_url?: string | null;
}

export function useRanking() {
  return useQuery({
    queryKey: ['ranking'],
    queryFn: async () => {
      const { data: ranking, error } = await supabase
        .from('v_ranking')
        .select('*');
      if (error) throw error;

      // Fetch champion predictions for all users
      const { data: championPreds } = await supabase
        .from('knockout_predictions')
        .select('user_id, team_id, teams(name, flag_url)')
        .eq('stage', 'CHAMPION');

      const championMap = new Map<string, { name: string; flag_url: string | null }>();
      championPreds?.forEach((p: any) => {
        if (p.teams) {
          championMap.set(p.user_id, { name: p.teams.name, flag_url: p.teams.flag_url });
        }
      });

      return (ranking as RankingEntry[]).map(r => ({
        ...r,
        champion_team_name: championMap.get(r.user_id)?.name ?? null,
        champion_flag_url: championMap.get(r.user_id)?.flag_url ?? null,
      }));
    },
  });
}
