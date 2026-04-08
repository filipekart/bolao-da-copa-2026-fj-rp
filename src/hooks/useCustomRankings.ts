import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export interface CustomRanking {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
  members: { user_id: string }[];
}

export function useCustomRankings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['custom-rankings', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: rankings, error } = await supabase
        .from('custom_rankings')
        .select('id, owner_id, name, created_at')
        .eq('owner_id', user!.id)
        .order('created_at', { ascending: true });
      if (error) throw error;

      const allMembers = await Promise.all(
        (rankings ?? []).map(async (r) => {
          const { data } = await supabase
            .from('custom_ranking_members')
            .select('user_id')
            .eq('ranking_id', r.id);
          return { ...r, members: data ?? [] };
        })
      );
      return allMembers as CustomRanking[];
    },
  });

  const createRanking = useMutation({
    mutationFn: async ({ name, memberIds }: { name: string; memberIds: string[] }) => {
      const { data: ranking, error } = await supabase
        .from('custom_rankings')
        .insert({ name, owner_id: user!.id })
        .select('id')
        .single();
      if (error) throw error;

      // Always include owner
      const uniqueIds = Array.from(new Set([user!.id, ...memberIds]));
      const rows = uniqueIds.map(uid => ({ ranking_id: ranking.id, user_id: uid }));
      const { error: mErr } = await supabase.from('custom_ranking_members').insert(rows);
      if (mErr) throw mErr;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['custom-rankings'] }),
  });

  const updateRanking = useMutation({
    mutationFn: async ({ id, name, memberIds }: { id: string; name: string; memberIds: string[] }) => {
      const { error } = await supabase.from('custom_rankings').update({ name }).eq('id', id);
      if (error) throw error;

      // Replace members
      await supabase.from('custom_ranking_members').delete().eq('ranking_id', id);
      const uniqueIds = Array.from(new Set([user!.id, ...memberIds]));
      const rows = uniqueIds.map(uid => ({ ranking_id: id, user_id: uid }));
      const { error: mErr } = await supabase.from('custom_ranking_members').insert(rows);
      if (mErr) throw mErr;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['custom-rankings'] }),
  });

  const deleteRanking = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('custom_rankings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['custom-rankings'] }),
  });

  return { ...query, createRanking, updateRanking, deleteRanking };
}
