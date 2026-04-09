import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MatchWithTeams {
  id: string;
  external_id: string | null;
  source_name: string;
  stage: string;
  match_number: number | null;
  kickoff_at: string;
  venue: string | null;
  city: string | null;
  status: string;
  official_home_score: number | null;
  official_away_score: number | null;
  home_team_id: string;
  home_team_name: string;
  home_team_flag_url: string | null;
  away_team_id: string;
  away_team_name: string;
  away_team_flag_url: string | null;
}

export function useMatches(stage?: 'GROUP_STAGE' | 'ROUND_OF_32' | 'ROUND_OF_16' | 'QUARTER_FINAL' | 'SEMI_FINAL' | 'FINAL') {
  return useQuery({
    queryKey: ['matches', stage],
    staleTime: 3 * 60 * 1000,
    queryFn: async () => {
      let query = supabase
        .from('v_matches_with_teams')
        .select('*')
        .order('kickoff_at', { ascending: true });

      if (stage) {
        query = query.eq('stage', stage);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MatchWithTeams[];
    },
  });
}

export function useMatch(matchId: string) {
  return useQuery({
    queryKey: ['match', matchId],
    staleTime: 3 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_matches_with_teams')
        .select('*')
        .eq('id', matchId)
        .single();
      if (error) throw error;
      return data as MatchWithTeams;
    },
    enabled: !!matchId,
  });
}
