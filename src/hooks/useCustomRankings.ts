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
      // Single round-trip: fetch all visible rankings with their members embedded.
      // RLS on both tables already restricts results to rankings the user owns
      // or is a member of. We bump the range to avoid the implicit 1000-row cap.
      const { data, error } = await supabase
        .from('custom_rankings')
        .select('id, owner_id, name, created_at, members:custom_ranking_members(user_id)')
        .order('created_at', { ascending: true })
        .range(0, 9999);
      if (error) throw error;

      return (data ?? []).map((r: any) => ({
        ...r,
        members: r.members ?? [],
      })) as CustomRanking[];
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
