import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useActiveProfile } from '@/lib/activeProfile';
import { toast } from 'sonner';

export function useMyPredictions() {
  const { user } = useAuth();
  const { activeUserId } = useActiveProfile();
  return useQuery({
    queryKey: ['my-predictions', activeUserId],
    queryFn: async () => {
      // Get predictions
      const { data: predictions, error } = await supabase
        .from('match_predictions')
        .select('*')
        .eq('user_id', activeUserId)
        .order('submitted_at', { ascending: false });
      if (error) throw error;

      if (!predictions?.length) return [];

      // Get match details with teams
      const matchIds = [...new Set(predictions.map(p => p.match_id))];
      const { data: matches, error: matchErr } = await supabase
        .from('v_matches_with_teams')
        .select('*')
        .in('id', matchIds);
      if (matchErr) throw matchErr;

      // Get group info for home teams
      const teamIds = [...new Set(matches?.flatMap(m => [m.home_team_id, m.away_team_id]).filter(Boolean) ?? [])];
      const { data: teams } = await supabase
        .from('teams')
        .select('id, group_name')
        .in('id', teamIds as string[]);
      const teamGroupMap = new Map(teams?.map(t => [t.id, t.group_name]) ?? []);

      const matchMap = new Map(matches?.map(m => [m.id, { ...m, group_name: teamGroupMap.get(m.home_team_id!) ?? null }]) ?? []);
      return predictions.map(p => ({
        ...p,
        match: matchMap.get(p.match_id) ?? null,
      }));
    },
    enabled: !!user && !!activeUserId,
  });
}

export function useMatchPrediction(matchId: string) {
  const { user } = useAuth();
  const { activeUserId } = useActiveProfile();
  return useQuery({
    queryKey: ['prediction', matchId, activeUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('match_predictions')
        .select('*')
        .eq('user_id', activeUserId)
        .eq('match_id', matchId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!matchId && !!activeUserId,
  });
}

export function useSubmitPrediction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { activeUserId, isActingAsOther } = useActiveProfile();
  return useMutation({
    mutationFn: async ({
      matchId,
      homeScore,
      awayScore,
    }: {
      matchId: string;
      homeScore: number;
      awayScore: number;
    }) => {
      const { data, error } = await supabase.rpc('submit_match_prediction', {
        p_match_id: matchId,
        p_predicted_home_score: homeScore,
        p_predicted_away_score: awayScore,
        ...(isActingAsOther ? { p_acting_as: activeUserId } : {}),
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['prediction', variables.matchId] });
      queryClient.invalidateQueries({ queryKey: ['my-predictions'] });
      queryClient.invalidateQueries({ queryKey: ['all-predictions'] });
      toast.success('Palpite salvo!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
