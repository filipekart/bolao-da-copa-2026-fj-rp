import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    staleTime: 30 * 60 * 1000, // teams rarely change
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}
