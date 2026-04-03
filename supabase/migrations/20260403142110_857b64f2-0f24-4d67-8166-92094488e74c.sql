
-- RPC to submit extra predictions (top_scorer, mvp) acting as managed profile
CREATE OR REPLACE FUNCTION public.submit_extra_prediction(
  p_category text,
  p_player_name text,
  p_team_id uuid,
  p_acting_as uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Usuário não autenticado'; END IF;

  IF p_acting_as IS NOT NULL AND p_acting_as <> v_user_id THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.managed_profiles
      WHERE manager_id = v_user_id AND managed_id = p_acting_as
    ) THEN
      RAISE EXCEPTION 'Você não tem permissão para apostar por este perfil';
    END IF;
    v_user_id := p_acting_as;
  END IF;

  INSERT INTO public.extra_predictions (user_id, category, player_name, team_id, submitted_at)
  VALUES (v_user_id, p_category, p_player_name, p_team_id, now())
  ON CONFLICT (user_id, category) DO UPDATE SET
    player_name = EXCLUDED.player_name,
    team_id = EXCLUDED.team_id,
    submitted_at = now();
END;
$$;

-- RPC to submit champion prediction acting as managed profile
CREATE OR REPLACE FUNCTION public.submit_champion_prediction(
  p_team_id uuid,
  p_acting_as uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Usuário não autenticado'; END IF;

  IF p_acting_as IS NOT NULL AND p_acting_as <> v_user_id THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.managed_profiles
      WHERE manager_id = v_user_id AND managed_id = p_acting_as
    ) THEN
      RAISE EXCEPTION 'Você não tem permissão para apostar por este perfil';
    END IF;
    v_user_id := p_acting_as;
  END IF;

  DELETE FROM public.knockout_predictions
  WHERE user_id = v_user_id AND stage = 'CHAMPION';

  INSERT INTO public.knockout_predictions (user_id, team_id, stage)
  VALUES (v_user_id, p_team_id, 'CHAMPION');
END;
$$;
