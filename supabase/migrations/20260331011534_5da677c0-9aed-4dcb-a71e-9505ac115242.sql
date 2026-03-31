
CREATE OR REPLACE VIEW public.v_group_standings
WITH (security_invoker = true)
AS
WITH match_results AS (
  SELECT
    m.home_team_id,
    m.away_team_id,
    m.official_home_score,
    m.official_away_score,
    ht.group_name
  FROM matches m
  JOIN teams ht ON ht.id = m.home_team_id
  WHERE m.stage = 'GROUP_STAGE'
    AND m.status = 'FINISHED'
    AND m.official_home_score IS NOT NULL
    AND m.official_away_score IS NOT NULL
),
team_stats AS (
  SELECT
    home_team_id AS team_id,
    group_name,
    1 AS played,
    CASE WHEN official_home_score > official_away_score THEN 1 ELSE 0 END AS wins,
    CASE WHEN official_home_score = official_away_score THEN 1 ELSE 0 END AS draws,
    CASE WHEN official_home_score < official_away_score THEN 1 ELSE 0 END AS losses,
    official_home_score AS gf,
    official_away_score AS ga
  FROM match_results
  UNION ALL
  SELECT
    away_team_id AS team_id,
    (SELECT group_name FROM teams WHERE id = match_results.away_team_id) AS group_name,
    1 AS played,
    CASE WHEN official_away_score > official_home_score THEN 1 ELSE 0 END AS wins,
    CASE WHEN official_away_score = official_home_score THEN 1 ELSE 0 END AS draws,
    CASE WHEN official_away_score < official_home_score THEN 1 ELSE 0 END AS losses,
    official_away_score AS gf,
    official_home_score AS ga
  FROM match_results
)
SELECT
  t.id AS team_id,
  t.name AS team_name,
  t.flag_url,
  t.group_name,
  COALESCE(SUM(ts.played), 0)::integer AS played,
  COALESCE(SUM(ts.wins), 0)::integer AS wins,
  COALESCE(SUM(ts.draws), 0)::integer AS draws,
  COALESCE(SUM(ts.losses), 0)::integer AS losses,
  COALESCE(SUM(ts.gf), 0)::integer AS goals_for,
  COALESCE(SUM(ts.ga), 0)::integer AS goals_against,
  (COALESCE(SUM(ts.gf), 0) - COALESCE(SUM(ts.ga), 0))::integer AS goal_difference,
  (COALESCE(SUM(ts.wins), 0) * 3 + COALESCE(SUM(ts.draws), 0))::integer AS points
FROM teams t
LEFT JOIN team_stats ts ON ts.team_id = t.id
WHERE t.group_name IS NOT NULL
GROUP BY t.id, t.name, t.flag_url, t.group_name
ORDER BY t.group_name, points DESC, goal_difference DESC, goals_for DESC, t.name;
