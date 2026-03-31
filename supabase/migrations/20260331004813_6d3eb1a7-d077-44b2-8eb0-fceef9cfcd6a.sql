
-- Fix security definer views
create or replace view public.v_matches_with_teams with (security_invoker = true) as
select m.id, m.external_id, m.source_name, m.stage, m.match_number, m.kickoff_at,
  m.venue, m.city, m.status, m.official_home_score, m.official_away_score,
  ht.id as home_team_id, ht.name as home_team_name, ht.flag_url as home_team_flag_url,
  at.id as away_team_id, at.name as away_team_name, at.flag_url as away_team_flag_url
from public.matches m
join public.teams ht on ht.id = m.home_team_id
join public.teams at on at.id = m.away_team_id;

create or replace view public.v_ranking with (security_invoker = true) as
select l.user_id, p.display_name, l.points_matches, l.points_knockout,
  l.points_total, l.exact_hits, l.updated_at
from public.leaderboard l join public.profiles p on p.id = l.user_id
order by l.points_total desc, l.exact_hits desc, p.display_name asc;

-- Fix function search_path warnings
create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create or replace function public.get_result_label(home_goals integer, away_goals integer)
returns text language plpgsql immutable set search_path = public as $$
begin
  if home_goals > away_goals then return 'HOME';
  elseif away_goals > home_goals then return 'AWAY';
  else return 'DRAW';
  end if;
end; $$;

create or replace function public.calculate_match_prediction_points(
  real_home integer, real_away integer, pred_home integer, pred_away integer
) returns table(points integer, rule_applied public.prediction_rule)
language plpgsql immutable set search_path = public as $$
declare
  real_result text; pred_result text;
  real_winner_goals integer; real_loser_goals integer;
  pred_winner_goals integer; pred_loser_goals integer;
begin
  real_result := public.get_result_label(real_home, real_away);
  pred_result := public.get_result_label(pred_home, pred_away);
  if real_home = pred_home and real_away = pred_away then
    return query select 25, 'EXACT_SCORE'::public.prediction_rule; return;
  end if;
  if real_result <> pred_result then
    return query select 0, 'MISS'::public.prediction_rule; return;
  end if;
  if real_result = 'DRAW' then
    return query select 10, 'DRAW_RESULT_ONLY'::public.prediction_rule; return;
  end if;
  if real_result = 'HOME' then
    real_winner_goals := real_home; real_loser_goals := real_away;
    pred_winner_goals := pred_home; pred_loser_goals := pred_away;
  else
    real_winner_goals := real_away; real_loser_goals := real_home;
    pred_winner_goals := pred_away; pred_loser_goals := pred_home;
  end if;
  if pred_winner_goals = real_winner_goals and pred_loser_goals <> real_loser_goals then
    return query select 18, 'WINNER_AND_WINNER_GOALS'::public.prediction_rule; return;
  end if;
  if pred_loser_goals = real_loser_goals and pred_winner_goals <> real_winner_goals then
    return query select 12, 'WINNER_AND_LOSER_GOALS'::public.prediction_rule; return;
  end if;
  if pred_home <> real_home and pred_away <> real_away then
    return query select 10, 'RESULT_ONLY'::public.prediction_rule; return;
  end if;
  return query select 0, 'MISS'::public.prediction_rule;
end; $$;
