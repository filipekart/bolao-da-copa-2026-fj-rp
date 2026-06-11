import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ExtraCategory = 'champion' | 'top_scorer' | 'mvp';

export interface ExtraStatRow {
  categoria: ExtraCategory;
  opcao_id: string;
  opcao_nome: string | null;
  flag_url: string | null;
  team_name: string | null;
  total_apostas: number;
  total_categoria: number;
}

export interface CategoryStats {
  total: number;
  options: ExtraStatRow[];
}

export interface ExtraStats {
  champion: CategoryStats;
  top_scorer: CategoryStats;
  mvp: CategoryStats;
}

export function useExtraPredictionsStats() {
  return useQuery({
    queryKey: ['extra-predictions-stats'],
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: async (): Promise<ExtraStats> => {
      const { data, error } = await supabase
        .from('v_extra_predictions_stats' as any)
        .select('*');
      if (error) throw error;

      const rows = (data ?? []) as unknown as ExtraStatRow[];
      const result: ExtraStats = {
        champion: { total: 0, options: [] },
        top_scorer: { total: 0, options: [] },
        mvp: { total: 0, options: [] },
      };
      for (const r of rows) {
        const cat = result[r.categoria];
        if (!cat) continue;
        cat.total = r.total_categoria ?? 0;
        cat.options.push(r);
      }
      (['champion', 'top_scorer', 'mvp'] as const).forEach((k) => {
        result[k].options.sort((a, b) => {
          if (b.total_apostas !== a.total_apostas) return b.total_apostas - a.total_apostas;
          return (a.opcao_nome ?? '').localeCompare(b.opcao_nome ?? '');
        });
      });
      return result;
    },
  });
}