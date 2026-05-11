import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Returns the kickoff timestamp of the very first match of the tournament.
 * Used as the single source of truth for locking Extras predictions
 * (Champion, Top Scorer, MVP). The trigger is MIN(matches.kickoff_at).
 *
 * Defense in depth: this is the UI layer; RPCs (submit_champion_prediction,
 * submit_extra_prediction) and RLS (is_tournament_open / is_knockout_stage_open)
 * enforce the same rule server-side.
 */
export function useFirstMatchKickoff() {
  return useQuery({
    queryKey: ['first-match-kickoff'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('kickoff_at')
        .order('kickoff_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data?.kickoff_at ? new Date(data.kickoff_at) : null;
    },
  });
}

/**
 * Helper: returns true when Extras betting must be locked.
 * If we can't determine the kickoff (null), we fail safe and lock.
 */
export function isExtrasLocked(firstKickoff: Date | null | undefined): boolean {
  if (!firstKickoff) return true;
  return new Date() >= firstKickoff;
}
