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
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<MatchPrediction[]> => {
      const [predsRes, profilesRes] = await Promise.all([
        supabase
          .from("match_predictions")
          .select("user_id, predicted_home_score, predicted_away_score, points_awarded, rule_applied")
          .eq("match_id", matchId),
        supabase.rpc("get_public_profiles"),
      ]);

      if (predsRes.error) throw predsRes.error;
      if (profilesRes.error) throw profilesRes.error;

      const nameById = new Map<string, string>(
        (profilesRes.data ?? []).map((p: any) => [p.id, p.display_name])
      );

      return (predsRes.data ?? [])
        .map((row: any) => ({
          user_id: row.user_id,
          display_name: nameById.get(row.user_id) ?? "—",
          predicted_home_score: row.predicted_home_score,
          predicted_away_score: row.predicted_away_score,
          points_awarded: row.points_awarded,
          rule_applied: row.rule_applied,
        }))
        .sort((a, b) => a.display_name.localeCompare(b.display_name));
    },
  });
}
