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
  top_scorer_name?: string | null;
  top_scorer_flag_url?: string | null;
  mvp_name?: string | null;
  mvp_flag_url?: string | null;
}

export function useRanking() {
  return useQuery({
    queryKey: ['ranking'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const [{ data: ranking, error }, { data: championPreds }, { data: extraPreds }] = await Promise.all([
        supabase.from('v_ranking').select('*'),
        supabase.from('knockout_predictions').select('user_id, team_id, teams(name, flag_url)').eq('stage', 'CHAMPION'),
        supabase.from('extra_predictions').select('user_id, category, player_name, teams(name, flag_url)').in('category', ['top_scorer', 'mvp']),
      ]);
      if (error) throw error;

      const championMap = new Map<string, { name: string; flag_url: string | null }>();
      championPreds?.forEach((p: any) => {
        if (p.teams) championMap.set(p.user_id, { name: p.teams.name, flag_url: p.teams.flag_url });
      });

      const extraMap = new Map<string, { top_scorer_name?: string; top_scorer_flag?: string | null; mvp_name?: string; mvp_flag?: string | null }>();
      extraPreds?.forEach((p: any) => {
        const entry = extraMap.get(p.user_id) || {};
        if (p.category === 'top_scorer') {
          entry.top_scorer_name = p.player_name;
          entry.top_scorer_flag = p.teams?.flag_url ?? null;
        } else if (p.category === 'mvp') {
          entry.mvp_name = p.player_name;
          entry.mvp_flag = p.teams?.flag_url ?? null;
        }
        extraMap.set(p.user_id, entry);
      });

      return (ranking as RankingEntry[]).map(r => ({
        ...r,
        champion_team_name: championMap.get(r.user_id)?.name ?? null,
        champion_flag_url: championMap.get(r.user_id)?.flag_url ?? null,
        top_scorer_name: extraMap.get(r.user_id)?.top_scorer_name ?? null,
        top_scorer_flag_url: extraMap.get(r.user_id)?.top_scorer_flag ?? null,
        mvp_name: extraMap.get(r.user_id)?.mvp_name ?? null,
        mvp_flag_url: extraMap.get(r.user_id)?.mvp_flag ?? null,
      }));
    },
  });
}
