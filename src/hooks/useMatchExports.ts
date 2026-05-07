import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MatchExport {
  match_id: string;
  storage_path: string;
  row_count: number;
  exported_at: string;
  match_number: number | null;
  kickoff_at: string;
  home_team_name: string;
  away_team_name: string;
}

export function useMatchExports() {
  return useQuery({
    queryKey: ['match-exports'],
    refetchInterval: 60_000,
    queryFn: async (): Promise<MatchExport[]> => {
      const { data: logs, error } = await supabase
        .from('match_export_log')
        .select('match_id, storage_path, row_count, exported_at')
        .order('exported_at', { ascending: false });
      if (error) throw error;
      if (!logs?.length) return [];

      const ids = logs.map((l) => l.match_id);
      const { data: matches, error: mErr } = await supabase
        .from('v_matches_with_teams')
        .select('id, match_number, kickoff_at, home_team_name, away_team_name')
        .in('id', ids);
      if (mErr) throw mErr;
      const map = new Map((matches ?? []).map((m: any) => [m.id, m]));

      return logs.map((l) => {
        const m: any = map.get(l.match_id) ?? {};
        return {
          match_id: l.match_id,
          storage_path: l.storage_path,
          row_count: l.row_count,
          exported_at: l.exported_at,
          match_number: m.match_number ?? null,
          kickoff_at: m.kickoff_at ?? '',
          home_team_name: m.home_team_name ?? '?',
          away_team_name: m.away_team_name ?? '?',
        };
      });
    },
  });
}

export function useDownloadMatchExport() {
  return useMutation({
    mutationFn: async (matchId: string) => {
      const { data, error } = await supabase.functions.invoke('get-match-export-url', {
        body: { match_id: matchId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.url) throw new Error('URL não retornada');
      window.open(data.url, '_blank');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRegenerateMatchExport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (matchId: string) => {
      const { data, error } = await supabase.functions.invoke('regenerate-match-export', {
        body: { match_id: matchId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['match-exports'] });
      toast.success('Planilha regerada!');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}