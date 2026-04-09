import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GroupStanding {
  team_id: string;
  team_name: string;
  flag_url: string | null;
  group_name: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

export function useGroupStandings() {
  return useQuery({
    queryKey: ['group-standings'],
    staleTime: 3 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_group_standings')
        .select('*');
      if (error) throw error;
      return data as GroupStanding[];
    },
  });
}
