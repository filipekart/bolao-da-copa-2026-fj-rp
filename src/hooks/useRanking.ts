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
      const { data, error } = await supabase.from('v_ranking').select('*');
      if (error) throw error;
      return data as RankingEntry[];
    },
  });
}
