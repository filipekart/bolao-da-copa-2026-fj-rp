
create extension if not exists pgcrypto;

create type public.match_stage as enum (
  'GROUP_STAGE','ROUND_OF_32','ROUND_OF_16','QUARTER_FINAL','SEMI_FINAL','FINAL'
);
create type public.match_status as enum (
  'SCHEDULED','LIVE','FINISHED','CANCELLED','POSTPONED'
);
create type public.knockout_stage as enum (
  'ROUND_OF_16','QUARTER_FINAL','SEMI_FINAL','FINAL','CHAMPION'
);
create type public.prediction_rule as enum (
  'EXACT_SCORE','RESULT_ONLY','WINNER_AND_WINNER_GOALS','WINNER_AND_LOSER_GOALS','DRAW_RESULT_ONLY','MISS','PENDING'
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  fifa_code text,
  name text not null unique,
  short_name text,
  flag_url text,
  group_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  source_name text not null default 'manual',
  stage public.match_stage not null,
  match_number integer,
  home_team_id uuid not null references public.teams(id),
  away_team_id uuid not null references public.teams(id),
  kickoff_at timestamptz not null,
  venue text,
  city text,
  status public.match_status not null default 'SCHEDULED',
  official_home_score integer,
  official_away_score integer,
  winner_team_id uuid references public.teams(id),
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint official_scores_non_negative check (official_home_score is null or official_home_score >= 0),
  constraint official_away_scores_non_negative check (official_away_score is null or official_away_score >= 0)
);
create index if not exists idx_matches_kickoff_at on public.matches(kickoff_at);
create index if not exists idx_matches_stage on public.matches(stage);
create index if not exists idx_matches_status on public.matches(status);

create table if not exists public.match_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  predicted_home_score integer not null,
  predicted_away_score integer not null,
  submitted_at timestamptz not null default now(),
  points_awarded integer not null default 0,
  rule_applied public.prediction_rule not null default 'PENDING',
  scored_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, match_id),
  constraint predicted_home_score_non_negative check (predicted_home_score >= 0),
  constraint predicted_away_score_non_negative check (predicted_away_score >= 0)
);
create index if not exists idx_match_predictions_user on public.match_predictions(user_id);
create index if not exists idx_match_predictions_match on public.match_predictions(match_id);

create table if not exists public.knockout_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stage public.knockout_stage not null,
  team_id uuid not null references public.teams(id) on delete cascade,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(user_id, stage, team_id)
);
create index if not exists idx_knockout_predictions_user on public.knockout_predictions(user_id);
create index if not exists idx_knockout_predictions_stage on public.knockout_predictions(stage);

create table if not exists public.knockout_results (
  id uuid primary key default gen_random_uuid(),
  stage public.knockout_stage not null,
  team_id uuid not null references public.teams(id) on delete cascade,
  confirmed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(stage, team_id)
);
create index if not exists idx_knockout_results_stage on public.knockout_results(stage);

create table if not exists public.leaderboard (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  points_matches integer not null default 0,
  points_knockout integer not null default 0,
  points_total integer not null default 0,
  exact_hits integer not null default 0,
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_matches_updated_at before update on public.matches for each row execute function public.set_updated_at();
create trigger trg_match_predictions_updated_at before update on public.match_predictions for each row execute function public.set_updated_at();

create or replace function public.get_result_label(home_goals integer, away_goals integer)
returns text language plpgsql immutable as $$
begin
  if home_goals > away_goals then return 'HOME';
  elseif away_goals > home_goals then return 'AWAY';
  else return 'DRAW';
  end if;
end; $$;

create or replace function public.calculate_match_prediction_points(
  real_home integer, real_away integer, pred_home integer, pred_away integer
) returns table(points integer, rule_applied public.prediction_rule)
language plpgsql immutable as $$
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

create or replace function public.submit_match_prediction(
  p_match_id uuid, p_predicted_home_score integer, p_predicted_away_score integer
) returns public.match_predictions language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid; v_match public.matches; v_prediction public.match_predictions;
begin
  v_user_id := auth.uid();
  if v_user_id is null then raise exception 'Usuário não autenticado'; end if;
  select * into v_match from public.matches where id = p_match_id;
  if not found then raise exception 'Partida não encontrada'; end if;
  if now() >= v_match.kickoff_at then raise exception 'O prazo para apostar nesta partida já encerrou'; end if;
  insert into public.match_predictions (user_id, match_id, predicted_home_score, predicted_away_score, submitted_at)
  values (v_user_id, p_match_id, p_predicted_home_score, p_predicted_away_score, now())
  on conflict (user_id, match_id) do update set
    predicted_home_score = excluded.predicted_home_score,
    predicted_away_score = excluded.predicted_away_score,
    submitted_at = now(), updated_at = now()
  returning * into v_prediction;
  return v_prediction;
end; $$;

create or replace function public.score_finished_matches()
returns void language plpgsql security definer set search_path = public as $$
declare rec record; calc record;
begin
  for rec in
    select mp.id as prediction_id, m.official_home_score, m.official_away_score,
           mp.predicted_home_score, mp.predicted_away_score
    from public.match_predictions mp
    join public.matches m on m.id = mp.match_id
    where m.status = 'FINISHED' and m.official_home_score is not null and m.official_away_score is not null
  loop
    select * into calc from public.calculate_match_prediction_points(
      rec.official_home_score, rec.official_away_score, rec.predicted_home_score, rec.predicted_away_score
    );
    update public.match_predictions set points_awarded = calc.points, rule_applied = calc.rule_applied,
      scored_at = now(), updated_at = now() where id = rec.prediction_id;
  end loop;
end; $$;

create or replace function public.refresh_leaderboard()
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.leaderboard (user_id, points_matches, points_knockout, points_total, exact_hits, updated_at)
  select p.id, coalesce(mp.points_matches,0), coalesce(kp.points_knockout,0),
    coalesce(mp.points_matches,0)+coalesce(kp.points_knockout,0), coalesce(mp.exact_hits,0), now()
  from public.profiles p
  left join (
    select user_id, sum(points_awarded)::integer as points_matches,
      count(*) filter (where rule_applied = 'EXACT_SCORE')::integer as exact_hits
    from public.match_predictions group by user_id
  ) mp on mp.user_id = p.id
  left join (
    select u.id as user_id, coalesce(sum(case
      when kp.stage = 'ROUND_OF_16' then 8 when kp.stage = 'QUARTER_FINAL' then 10
      when kp.stage = 'SEMI_FINAL' then 12 when kp.stage = 'FINAL' then 25
      when kp.stage = 'CHAMPION' then 50 else 0 end),0)::integer as points_knockout
    from public.profiles u
    left join public.knockout_predictions kp on kp.user_id = u.id
    left join public.knockout_results kr on kr.stage = kp.stage and kr.team_id = kp.team_id
    where kr.id is not null group by u.id
  ) kp on kp.user_id = p.id
  on conflict (user_id) do update set
    points_matches = excluded.points_matches, points_knockout = excluded.points_knockout,
    points_total = excluded.points_total, exact_hits = excluded.exact_hits, updated_at = now();
end; $$;

create or replace view public.v_matches_with_teams as
select m.id, m.external_id, m.source_name, m.stage, m.match_number, m.kickoff_at,
  m.venue, m.city, m.status, m.official_home_score, m.official_away_score,
  ht.id as home_team_id, ht.name as home_team_name, ht.flag_url as home_team_flag_url,
  at.id as away_team_id, at.name as away_team_name, at.flag_url as away_team_flag_url
from public.matches m
join public.teams ht on ht.id = m.home_team_id
join public.teams at on at.id = m.away_team_id;

create or replace view public.v_ranking as
select l.user_id, p.display_name, l.points_matches, l.points_knockout,
  l.points_total, l.exact_hits, l.updated_at
from public.leaderboard l join public.profiles p on p.id = l.user_id
order by l.points_total desc, l.exact_hits desc, p.display_name asc;

alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.matches enable row level security;
alter table public.match_predictions enable row level security;
alter table public.knockout_predictions enable row level security;
alter table public.knockout_results enable row level security;
alter table public.leaderboard enable row level security;

create policy "profiles are readable by authenticated users" on public.profiles for select using (auth.role() = 'authenticated');
create policy "user can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "user can update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "teams readable" on public.teams for select using (auth.role() = 'authenticated');
create policy "matches readable" on public.matches for select using (auth.role() = 'authenticated');
create policy "knockout_results readable" on public.knockout_results for select using (auth.role() = 'authenticated');
create policy "leaderboard readable" on public.leaderboard for select using (auth.role() = 'authenticated');
create policy "users read own match predictions" on public.match_predictions for select using (auth.uid() = user_id);
create policy "users insert own match predictions" on public.match_predictions for insert with check (auth.uid() = user_id);
create policy "users update own match predictions" on public.match_predictions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users read own knockout predictions" on public.knockout_predictions for select using (auth.uid() = user_id);
create policy "users insert own knockout predictions" on public.knockout_predictions for insert with check (auth.uid() = user_id);
create policy "users delete own knockout predictions" on public.knockout_predictions for delete using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
