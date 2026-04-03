import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

export function useIsAdmin() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user!.id)
        .eq('role', 'admin');
      if (error) throw error;
      return (data?.length ?? 0) > 0;
    },
    enabled: !!user,
  });
}

export function useIsApproved() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['is-approved', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('approved')
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      return data?.approved ?? false;
    },
    enabled: !!user,
  });
}

export interface PendingUser {
  id: string;
  display_name: string;
  approved: boolean;
  created_at: string;
  pix_key: string | null;
}

export function usePendingUsers() {
  return useQuery({
    queryKey: ['pending-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, approved, created_at, pix_key')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PendingUser[];
    },
  });
}

export function useApproveUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, approved }: { userId: string; approved: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ approved })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: (_, { approved }) => {
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      toast.success(approved ? 'Usuário aprovado!' : 'Usuário bloqueado.');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateUserName() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, displayName }: { userId: string; displayName: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      toast.success('Nome atualizado!');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateMatchResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ matchId, homeScore, awayScore, status }: {
      matchId: string;
      homeScore: number;
      awayScore: number;
      status: 'FINISHED' | 'LIVE' | 'SCHEDULED';
    }) => {
      const { error } = await supabase
        .from('matches')
        .update({
          official_home_score: homeScore,
          official_away_score: awayScore,
          status,
        })
        .eq('id', matchId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      toast.success('Resultado atualizado!');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRecalculateScores() {
  return useMutation({
    mutationFn: async () => {
      const { error: scoreErr } = await supabase.rpc('score_finished_matches');
      if (scoreErr) throw scoreErr;
      const { error: lbErr } = await supabase.rpc('refresh_leaderboard');
      if (lbErr) throw lbErr;
    },
    onSuccess: () => toast.success('Pontuações recalculadas!'),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useFetchFifaResults() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-fifa-results');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Resultados atualizados! ${data?.updated ?? 0} jogos sincronizados.`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { user_id: userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      toast.success('Usuário excluído!');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export interface ManagedProfileAdmin {
  id: string;
  manager_id: string;
  managed_id: string;
  manager_name: string;
  managed_name: string;
}

export function useManagedProfilesAdmin() {
  return useQuery({
    queryKey: ['managed-profiles-admin'],
    queryFn: async () => {
      const { data: links, error } = await supabase
        .from('managed_profiles')
        .select('id, manager_id, managed_id')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!links?.length) return [] as ManagedProfileAdmin[];

      const { data: profiles } = await supabase.rpc('get_public_profiles');
      const nameMap = new Map((profiles ?? []).map(p => [p.id, p.display_name]));

      return links.map(l => ({
        ...l,
        manager_name: nameMap.get(l.manager_id) ?? '?',
        managed_name: nameMap.get(l.managed_id) ?? '?',
      })) as ManagedProfileAdmin[];
    },
  });
}

export function useCreateManagedProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ managerId, managedId }: { managerId: string; managedId: string }) => {
      const { error } = await supabase
        .from('managed_profiles')
        .insert({ manager_id: managerId, managed_id: managedId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managed-profiles-admin'] });
      toast.success('Vínculo criado!');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteManagedProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('managed_profiles')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managed-profiles-admin'] });
      toast.success('Vínculo removido!');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { user_id: userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      toast.success('Usuário excluído!');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
