CREATE OR REPLACE FUNCTION public.admin_set_extra_result(p_category text, p_player_name text, p_team_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  IF p_team_id IS NULL THEN
    RAISE EXCEPTION 'Selecione o time antes de salvar o resultado oficial';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.teams WHERE id = p_team_id) THEN
    RAISE EXCEPTION 'Time selecionado não existe';
  END IF;

  IF p_player_name IS NULL OR length(trim(p_player_name)) = 0 THEN
    RAISE EXCEPTION 'Selecione o jogador antes de salvar o resultado oficial';
  END IF;

  DELETE FROM public.extra_predictions WHERE category = p_category;

  INSERT INTO public.extra_predictions (user_id, category, player_name, team_id, submitted_at)
  VALUES (v_admin_id, p_category, trim(p_player_name), p_team_id, now());

  PERFORM public.refresh_leaderboard();
END;
$function$;