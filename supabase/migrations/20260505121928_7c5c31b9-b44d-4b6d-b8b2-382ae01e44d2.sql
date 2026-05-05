-- Admin RPC: set/clear champion result
CREATE OR REPLACE FUNCTION public.admin_set_champion(p_team_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas admins podem registrar o campeão';
  END IF;

  DELETE FROM public.knockout_results WHERE stage = 'CHAMPION';
  INSERT INTO public.knockout_results (stage, team_id) VALUES ('CHAMPION', p_team_id);

  PERFORM public.refresh_leaderboard();
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_clear_champion()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas admins podem limpar o campeão';
  END IF;

  DELETE FROM public.knockout_results WHERE stage = 'CHAMPION';
  PERFORM public.refresh_leaderboard();
END;
$$;

-- Admin RPC: set/clear extra result (top_scorer_result or mvp_result)
CREATE OR REPLACE FUNCTION public.admin_set_extra_result(
  p_category text,
  p_player_name text,
  p_team_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin_id uuid;
BEGIN
  v_admin_id := auth.uid();
  IF NOT public.has_role(v_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Apenas admins podem registrar resultados oficiais';
  END IF;

  IF p_category NOT IN ('top_scorer_result', 'mvp_result') THEN
    RAISE EXCEPTION 'Categoria inválida: %', p_category;
  END IF;

  IF p_player_name IS NULL OR length(trim(p_player_name)) = 0 THEN
    RAISE EXCEPTION 'Nome do jogador é obrigatório';
  END IF;

  -- Wipe any existing official result for this category (regardless of who registered)
  DELETE FROM public.extra_predictions WHERE category = p_category;

  INSERT INTO public.extra_predictions (user_id, category, player_name, team_id, submitted_at)
  VALUES (v_admin_id, p_category, trim(p_player_name), p_team_id, now());

  PERFORM public.refresh_leaderboard();
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_clear_extra_result(p_category text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas admins podem limpar resultados oficiais';
  END IF;

  IF p_category NOT IN ('top_scorer_result', 'mvp_result') THEN
    RAISE EXCEPTION 'Categoria inválida: %', p_category;
  END IF;

  DELETE FROM public.extra_predictions WHERE category = p_category;
  PERFORM public.refresh_leaderboard();
END;
$$;

-- Read helper: official champion (returns team info)
CREATE OR REPLACE FUNCTION public.get_official_extras()
RETURNS TABLE(
  champion_team_id uuid,
  champion_team_name text,
  champion_flag_url text,
  top_scorer_name text,
  top_scorer_team_id uuid,
  top_scorer_flag_url text,
  mvp_name text,
  mvp_team_id uuid,
  mvp_flag_url text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    ch.team_id,
    ch_t.name,
    ch_t.flag_url,
    ts.player_name,
    ts.team_id,
    ts_t.flag_url,
    mv.player_name,
    mv.team_id,
    mv_t.flag_url
  FROM (SELECT 1) dummy
  LEFT JOIN public.knockout_results ch ON ch.stage = 'CHAMPION'
  LEFT JOIN public.teams ch_t ON ch_t.id = ch.team_id
  LEFT JOIN public.extra_predictions ts ON ts.category = 'top_scorer_result'
  LEFT JOIN public.teams ts_t ON ts_t.id = ts.team_id
  LEFT JOIN public.extra_predictions mv ON mv.category = 'mvp_result'
  LEFT JOIN public.teams mv_t ON mv_t.id = mv.team_id;
$$;