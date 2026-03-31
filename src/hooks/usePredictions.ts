import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

export function useMyPredictions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-predictions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('match_predictions')
        .select('*, matches(*)')
        .eq('user_id', user!.id)
        .order('submitted_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useMatchPrediction(matchId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['prediction', matchId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('match_predictions')
        .select('*')
        .eq('user_id', user!.id)
        .eq('match_id', matchId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!matchId,
  });
}

export function useSubmitPrediction() {
  const queryClient = useQueryClient();
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
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['prediction', variables.matchId] });
      queryClient.invalidateQueries({ queryKey: ['my-predictions'] });
      toast.success('Palpite salvo!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
