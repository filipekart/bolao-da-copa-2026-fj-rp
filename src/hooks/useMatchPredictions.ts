import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MatchPrediction {
  user_id: string;
  display_name: string;
  predicted_home_score: number;
  predicted_away_score: number;
  points_awarded: number;
  rule_applied: string;
}

export function useMatchPredictions(matchId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["match-predictions", matchId],
    enabled,
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<MatchPrediction[]> => {
      const { data, error } = await supabase
        .from("match_predictions")
        .select("user_id, predicted_home_score, predicted_away_score, points_awarded, rule_applied, profiles!match_predictions_user_id_fkey(display_name)")
        .eq("match_id", matchId);

      if (error) throw error;

      return (data ?? [])
        .map((row: any) => ({
          user_id: row.user_id,
          display_name: row.profiles?.display_name ?? "—",
          predicted_home_score: row.predicted_home_score,
          predicted_away_score: row.predicted_away_score,
          points_awarded: row.points_awarded,
          rule_applied: row.rule_applied,
        }))
        .sort((a, b) => a.display_name.localeCompare(b.display_name));
    },
  });
}
