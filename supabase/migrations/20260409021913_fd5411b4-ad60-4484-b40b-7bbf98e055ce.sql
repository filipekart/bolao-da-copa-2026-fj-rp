
-- 1. Add composite index on match_predictions for scoring queries
CREATE INDEX IF NOT EXISTS idx_match_predictions_scored ON public.match_predictions (match_id, scored_at);

-- 2. Add index on leaderboard for ranking queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_points ON public.leaderboard (points_total DESC);

-- 3. Add index on teams group_name for group standings view
CREATE INDEX IF NOT EXISTS idx_teams_group_name ON public.teams (group_name);

-- 4. Add index on extra_predictions category for ranking joins
CREATE INDEX IF NOT EXISTS idx_extra_predictions_category ON public.extra_predictions (category);

-- 5. Optimize v_group_standings: replace correlated subquery with JOIN
CREATE OR REPLACE VIEW public.v_group_standings AS
WITH match_results AS (
  SELECT m.home_team_id, m.away_team_id,
         m.official_home_score, m.official_away_score,
         ht.group_name
  FROM matches m
  JOIN teams ht ON ht.id = m.home_team_id
  WHERE m.stage = 'GROUP_STAGE' AND m.status = 'FINISHED'
    AND m.official_home_score IS NOT NULL AND m.official_away_score IS NOT NULL
), team_stats AS (
  SELECT home_team_id AS team_id, group_name, 1 AS played,
    CASE WHEN official_home_score > official_away_score THEN 1 ELSE 0 END AS wins,
    CASE WHEN official_home_score = official_away_score THEN 1 ELSE 0 END AS draws,
    CASE WHEN official_home_score < official_away_score THEN 1 ELSE 0 END AS losses,
    official_home_score AS gf, official_away_score AS ga
  FROM match_results
  UNION ALL
  SELECT mr.away_team_id AS team_id, at2.group_name, 1 AS played,
    CASE WHEN mr.official_away_score > mr.official_home_score THEN 1 ELSE 0 END AS wins,
    CASE WHEN mr.official_away_score = mr.official_home_score THEN 1 ELSE 0 END AS draws,
    CASE WHEN mr.official_away_score < mr.official_home_score THEN 1 ELSE 0 END AS losses,
    mr.official_away_score AS gf, mr.official_home_score AS ga
  FROM match_results mr
  JOIN teams at2 ON at2.id = mr.away_team_id
)
SELECT t.id AS team_id, t.name AS team_name, t.flag_url, t.group_name,
  COALESCE(SUM(ts.played), 0)::int AS played,
  COALESCE(SUM(ts.wins), 0)::int AS wins,
  COALESCE(SUM(ts.draws), 0)::int AS draws,
  COALESCE(SUM(ts.losses), 0)::int AS losses,
  COALESCE(SUM(ts.gf), 0)::int AS goals_for,
  COALESCE(SUM(ts.ga), 0)::int AS goals_against,
  (COALESCE(SUM(ts.gf), 0) - COALESCE(SUM(ts.ga), 0))::int AS goal_difference,
  (COALESCE(SUM(ts.wins), 0) * 3 + COALESCE(SUM(ts.draws), 0))::int AS points
FROM teams t
LEFT JOIN team_stats ts ON ts.team_id = t.id
WHERE t.group_name IS NOT NULL
GROUP BY t.id, t.name, t.flag_url, t.group_name
ORDER BY t.group_name, points DESC, goal_difference DESC, goals_for DESC;
