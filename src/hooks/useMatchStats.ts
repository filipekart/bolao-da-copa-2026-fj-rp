import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MatchStats {
  result_distribution: { home_pct: number; draw_pct: number; away_pct: number };
  top_scores: { home: number; away: number; count: number }[];
  exact_hits: number;
  total_predictions: number;
  points_breakdown: { p25: number; p18: number; p12: number; p10: number; p0: number };
  total_points_awarded: number;
}

export function useMatchStats(matchId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["match-stats", matchId],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<MatchStats> => {
      const { data, error } = await supabase
        .from("match_predictions")
        .select("predicted_home_score, predicted_away_score, points_awarded, rule_applied")
        .eq("match_id", matchId);

      if (error) throw error;

      const rows = data ?? [];
      const total = rows.length;

      // result distribution
      let home = 0, draw = 0, away = 0;
      for (const r of rows) {
        if (r.predicted_home_score > r.predicted_away_score) home++;
        else if (r.predicted_home_score === r.predicted_away_score) draw++;
        else away++;
      }
      const result_distribution = {
        home_pct: total ? Math.round((home / total) * 100) : 0,
        draw_pct: total ? Math.round((draw / total) * 100) : 0,
        away_pct: total ? Math.round((away / total) * 100) : 0,
      };

      // top scores
      const scoreMap = new Map<string, { home: number; away: number; count: number }>();
      for (const r of rows) {
        const key = `${r.predicted_home_score}-${r.predicted_away_score}`;
        const existing = scoreMap.get(key);
        if (existing) existing.count++;
        else scoreMap.set(key, { home: r.predicted_home_score, away: r.predicted_away_score, count: 1 });
      }
      const top_scores = [...scoreMap.values()]
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // exact hits
      const exact_hits = rows.filter((r) => r.rule_applied === "EXACT_SCORE").length;

      // points breakdown
      const points_breakdown = { p25: 0, p18: 0, p12: 0, p10: 0, p0: 0 };
      let total_points_awarded = 0;
      for (const r of rows) {
        total_points_awarded += r.points_awarded;
        if (r.points_awarded === 25) points_breakdown.p25++;
        else if (r.points_awarded === 18) points_breakdown.p18++;
        else if (r.points_awarded === 12) points_breakdown.p12++;
        else if (r.points_awarded === 10) points_breakdown.p10++;
        else if (r.points_awarded === 0 && r.rule_applied !== "PENDING") points_breakdown.p0++;
      }

      return {
        result_distribution,
        top_scores,
        exact_hits,
        total_predictions: total,
        points_breakdown,
        total_points_awarded,
      };
    },
  });
}
