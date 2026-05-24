
-- Harden score_finished_matches and refresh_leaderboard with admin check
CREATE OR REPLACE FUNCTION public.score_finished_matches()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare rec record; calc record;
begin
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas admins podem reprocessar pontuações';
  END IF;

  UPDATE public.match_predictions mp
  SET points_awarded = 0, rule_applied = 'PENDING', scored_at = NULL, updated_at = now()
  FROM public.matches m
  WHERE m.id = mp.match_id
    AND (m.status <> 'FINISHED' OR m.official_home_score IS NULL OR m.official_away_score IS NULL)
    AND mp.scored_at IS NOT NULL;

  for rec in
    select mp.id as prediction_id, m.official_home_score, m.official_away_score,
           mp.predicted_home_score, mp.predicted_away_score
    from public.match_predictions mp
    join public.matches m on m.id = mp.match_id
    where m.status = 'FINISHED'
      and m.official_home_score is not null
      and m.official_away_score is not null
      and (mp.scored_at IS NULL OR m.updated_at > mp.scored_at)
  loop
    select * into calc from public.calculate_match_prediction_points(
      rec.official_home_score, rec.official_away_score, rec.predicted_home_score, rec.predicted_away_score
    );
    update public.match_predictions set points_awarded = calc.points, rule_applied = calc.rule_applied,
      scored_at = now(), updated_at = now() where id = rec.prediction_id;
  end loop;
end;
$function$;

CREATE OR REPLACE FUNCTION public.refresh_leaderboard()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas admins podem atualizar o ranking';
  END IF;

  INSERT INTO public.leaderboard (user_id, points_matches, points_knockout, points_total, exact_hits, updated_at)
  SELECT
    p.id AS user_id,
    COALESCE(mp.points_matches, 0),
    COALESCE(ch.champion_points, 0) + COALESCE(ts.scorer_points, 0) + COALESCE(mv.mvp_points, 0),
    COALESCE(mp.points_matches, 0) + COALESCE(ch.champion_points, 0) + COALESCE(ts.scorer_points, 0) + COALESCE(mv.mvp_points, 0),
    COALESCE(mp.exact_hits, 0),
    now()
  FROM public.profiles p
  LEFT JOIN (
    SELECT user_id,
      SUM(points_awarded)::integer AS points_matches,
      COUNT(*) FILTER (WHERE rule_applied = 'EXACT_SCORE')::integer AS exact_hits
    FROM public.match_predictions GROUP BY user_id
  ) mp ON mp.user_id = p.id
  LEFT JOIN (
    SELECT kp.user_id, 100 AS champion_points
    FROM public.knockout_predictions kp
    INNER JOIN public.knockout_results kr ON kr.stage = 'CHAMPION' AND kr.team_id = kp.team_id
    WHERE kp.stage = 'CHAMPION'
  ) ch ON ch.user_id = p.id
  LEFT JOIN (
    SELECT ep.user_id, 50 AS scorer_points
    FROM public.extra_predictions ep
    INNER JOIN public.extra_predictions admin_result
      ON admin_result.category = 'top_scorer_result'
      AND lower(trim(ep.player_name)) = lower(trim(admin_result.player_name))
    WHERE ep.category = 'top_scorer'
  ) ts ON ts.user_id = p.id
  LEFT JOIN (
    SELECT ep.user_id, 50 AS mvp_points
    FROM public.extra_predictions ep
    INNER JOIN public.extra_predictions admin_result
      ON admin_result.category = 'mvp_result'
      AND lower(trim(ep.player_name)) = lower(trim(admin_result.player_name))
    WHERE ep.category = 'mvp'
  ) mv ON mv.user_id = p.id
  ON CONFLICT (user_id)
  DO UPDATE SET
    points_matches = excluded.points_matches,
    points_knockout = excluded.points_knockout,
    points_total = excluded.points_total,
    exact_hits = excluded.exact_hits,
    updated_at = now();
END;
$function$;

-- Category C: revoke from anon, authenticated, public (only used in RLS/triggers/service_role)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_match_open(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_tournament_open() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_knockout_stage_open(knockout_stage) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_ranking_owner(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_ranking_member(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_extras_completion() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.score_finished_matches() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.refresh_leaderboard() FROM PUBLIC, anon;

-- Categories A & B: revoke from anon and public, keep authenticated
REVOKE EXECUTE ON FUNCTION public.submit_match_prediction(uuid, integer, integer, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.submit_champion_prediction(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.submit_extra_prediction(text, text, uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_public_profiles() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_official_extras() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_round_ranking(integer, integer, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_champion(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_clear_champion() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_extra_result(text, text, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_clear_extra_result(text) FROM PUBLIC, anon;

-- Helper immutable functions: revoke from public
REVOKE EXECUTE ON FUNCTION public.calculate_match_prediction_points(integer, integer, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_result_label(integer, integer) FROM PUBLIC, anon, authenticated;
