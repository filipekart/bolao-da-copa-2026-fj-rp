import { useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useActiveProfile } from '@/lib/activeProfile';
import { toast } from 'sonner';

/**
 * Erro transiente = sem `code` PostgREST definido (timeout, fetch fail, 5xx sem corpo).
 * Erro definitivo = qualquer coisa com `code` (P0001 regra de negócio, 23505, 42501, etc.).
 * Nunca usamos match de string da mensagem (i18n + mudanças de copy quebrariam).
 */
function isTransientError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return true;
  const e = error as { code?: unknown; name?: unknown; status?: unknown };
  if (typeof e.code === 'string' && e.code.length > 0) return false;
  if (typeof e.status === 'number' && e.status >= 400 && e.status < 500) return false;
  return true;
}

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
  type Vars = { matchId: string; homeScore: number; awayScore: number };
  // Ref atualizada a cada render para permitir retry manual a partir do toast
  // sem dependência circular com o objeto da mutation.
  const mutateRef = useRef<((vars: Vars) => void) | null>(null);
  const mutation = useMutation({
    mutationKey: ['submit-prediction', activeUserId],
    mutationFn: async ({ matchId, homeScore, awayScore }: Vars) => {
      const { data, error } = await supabase.rpc('submit_match_prediction', {
        p_match_id: matchId,
        p_predicted_home_score: homeScore,
        p_predicted_away_score: awayScore,
        ...(isActingAsOther ? { p_acting_as: activeUserId } : {}),
      });
      if (error) throw error;
      return data;
    },
    retry: (failureCount, error) => {
      if (!isTransientError(error)) return false;
      return failureCount < 4;
    },
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['prediction', variables.matchId] });
      queryClient.invalidateQueries({ queryKey: ['my-predictions'] });
      queryClient.invalidateQueries({ queryKey: ['all-predictions'] });
      queryClient.invalidateQueries({ queryKey: ['knockout-match-predictions'] });
      toast.success('Palpite salvo!');
    },
    onError: (error: Error, variables) => {
      const transient = isTransientError(error);
      const msg = error.message || 'Erro ao salvar palpite';
      if (transient) {
        toast.error(msg, {
          action: {
            label: 'Tentar de novo',
            onClick: () => {
              // mesma assinatura do mutationFn — payload idêntico
              mutateRef.current?.(variables);
            },
          },
        });
      } else {
        toast.error(msg);
      }
    },
  });
  mutateRef.current = mutation.mutate;
  return mutation;
}
