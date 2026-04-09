CREATE OR REPLACE FUNCTION public.score_finished_matches()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
declare rec record; calc record;
begin
  -- Reset predictions for matches that are NOT finished anymore
  UPDATE public.match_predictions mp
  SET points_awarded = 0, rule_applied = 'PENDING', scored_at = NULL, updated_at = now()
  FROM public.matches m
  WHERE m.id = mp.match_id
    AND (m.status <> 'FINISHED' OR m.official_home_score IS NULL OR m.official_away_score IS NULL)
    AND mp.scored_at IS NOT NULL;

  -- Score only predictions that need updating:
  -- either never scored, or the match result changed since last scoring
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
$$;