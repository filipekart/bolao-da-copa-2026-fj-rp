import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserExactHit {
  match_id: string;
  match_number: number;
  stage: string;
  kickoff_at: string;
  home_team_name: string | null;
  home_flag_url: string | null;
  away_team_name: string | null;
  away_flag_url: string | null;
  official_home_score: number | null;
  official_away_score: number | null;
  predicted_home_score: number | null;
  predicted_away_score: number | null;
}

export function useUserExactHits(userId: string | null | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['user-exact-hits', userId],
    enabled: !!userId && enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_exact_hits', { p_user_id: userId! });
      if (error) throw error;
      return (data ?? []) as unknown as UserExactHit[];
    },
  });
}