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
}

export function useRanking() {
  return useQuery({
    queryKey: ['ranking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_ranking')
        .select('*');
      if (error) throw error;
      return data as RankingEntry[];
    },
  });
}
