
DROP FUNCTION IF EXISTS public.calculate_match_prediction_points(integer, integer, integer, integer);

CREATE FUNCTION public.calculate_match_prediction_points(
  pred_home integer,
  pred_away integer,
  real_home integer,
  real_away integer
)
RETURNS TABLE(points integer, rule_applied public.prediction_rule)
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Exact score
  IF pred_home = real_home AND pred_away = real_away THEN
    RETURN QUERY SELECT 25, 'EXACT_SCORE'::public.prediction_rule;
    RETURN;
  END IF;

  -- Check if prediction and result have same outcome
  IF public.get_result_label(pred_home, pred_away) = public.get_result_label(real_home, real_away) THEN
    -- Draw (not exact) → 16 points
    IF real_home = real_away THEN
      RETURN QUERY SELECT 16, 'DRAW_RESULT_ONLY'::public.prediction_rule;
      RETURN;
    END IF;

    -- Winner + winner goals correct
    IF (real_home > real_away AND pred_home = real_home) OR
       (real_away > real_home AND pred_away = real_away) THEN
      RETURN QUERY SELECT 18, 'WINNER_AND_WINNER_GOALS'::public.prediction_rule;
      RETURN;
    END IF;

    -- Winner + loser goals correct
    IF (real_home > real_away AND pred_away = real_away) OR
       (real_away > real_home AND pred_home = real_home) THEN
      RETURN QUERY SELECT 12, 'WINNER_AND_LOSER_GOALS'::public.prediction_rule;
      RETURN;
    END IF;

    -- Just the result (winner) correct
    RETURN QUERY SELECT 10, 'RESULT_ONLY'::public.prediction_rule;
    RETURN;
  END IF;

  -- Miss
  RETURN QUERY SELECT 0, 'MISS'::public.prediction_rule;
END;
$$;
