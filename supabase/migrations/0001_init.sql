-- Ocean Opportunity Radar — initial schema
-- Reference entities use readable text ids (slugs) so seeds, agents and URLs share one key.

create extension if not exists pgcrypto;

-- ---------- Reference data ----------
create table if not exists theses (
  id          text primary key,
  name        text not null,
  kind        text not null check (kind in ('vc', 'accelerator', 'custom')),
  description text,
  config      jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create table if not exists startups (
  id                text primary key,
  name              text not null,
  website           text,
  country           text,
  city              text,
  founded           int,
  one_liner         text,
  sectors           text[] not null default '{}',
  stage             text,
  known_funding_eur numeric,
  source            text,
  apelago_alumnus   boolean not null default false,
  demo_priority     text,
  logo_url          text,
  profile           jsonb,               -- Scout agent output (facts + evidence)
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists investors (
  id                  text primary key,
  name                text not null,
  type                text not null,      -- vc | cvc | pe | public_investor | angel_network
  hq                  text,
  region_focus        text[] not null default '{}',
  stages              text[] not null default '{}',
  ticket_min_eur      numeric,
  ticket_max_eur      numeric,
  fund_size_eur_m     numeric,
  sectors             text[] not null default '{}',
  thesis              text,
  impact_required     boolean not null default false,
  portfolio           text[] not null default '{}',
  contacts            text[] not null default '{}',
  website             text,
  confidence          text,
  is_challenge_partner boolean not null default false,
  linked_funding      text
);

create table if not exists funding (
  id               text primary key,
  name             text not null,
  provider         text,
  kind             text not null,         -- grant | loan | prize | grant_equity | accelerator | support_programme | ecosystem_programme
  geo_eligibility  text[] not null default '{}',
  applicant        text[] not null default '{}',
  stages           text[] not null default '{}',
  amount_min_eur   numeric,
  amount_max_eur   numeric,
  equity_min_eur   numeric,
  equity_max_eur   numeric,
  cofunding_pct    numeric,
  trl_min          int,
  trl_max          int,
  sectors          text[] not null default '{}',
  deadline_text    text,
  deadline_date    date,
  rolling          boolean not null default false,
  description      text,
  url              text,
  requires         text,
  notes            text,
  confidence       text,
  is_challenge_partner boolean not null default false
);

create table if not exists partners (
  id          text primary key,
  name        text not null,
  kind        text not null,              -- corporate | research | ecosystem | public
  role        text[] not null default '{}',
  hq          text,
  region      text[] not null default '{}',
  sectors     text[] not null default '{}',
  needs       text,
  why_partner text,
  confidence  text
);

-- Typed edges between any two entities (powers warm-intro paths)
create table if not exists relationships (
  id        uuid primary key default gen_random_uuid(),
  from_type text not null,
  from_id   text not null,
  to_type   text not null,
  to_id     text not null,
  rel       text not null,                -- lp_of | portfolio_of | partner_of | runs | member_of | certifies | co_funds
  note      text,
  source    text,
  unique (from_type, from_id, to_type, to_id, rel)
);

-- ---------- Agent outputs ----------
create table if not exists assessments (
  id                uuid primary key default gen_random_uuid(),
  startup_id        text not null references startups(id) on delete cascade,
  framework         text not null check (framework in ('trl', 'brl', 'oirl', 'irl')),
  level             int not null,
  confidence        numeric,
  distribution      jsonb,              -- calibrated probabilities per level (Jev) when available
  calibrator        text,               -- 'jev' | 'claude'
  rationale         text,
  evidence          jsonb not null default '[]'::jsonb,
  gaps              jsonb not null default '[]'::jsonb,
  next_requirements jsonb not null default '[]'::jsonb,
  details           jsonb,              -- framework-specific (IRL dimensions, OIRL impact areas, ...)
  needs_review      boolean not null default false,
  model             text,
  created_at        timestamptz not null default now(),
  unique (startup_id, framework)
);

create table if not exists matches (
  id          uuid primary key default gen_random_uuid(),
  startup_id  text not null references startups(id) on delete cascade,
  thesis_id   text not null references theses(id) on delete cascade,
  target_type text not null check (target_type in ('investor', 'funding', 'partner')),
  target_id   text not null,
  fit         numeric not null,
  priority    numeric not null,
  rank        int,
  status      text,                      -- ready | stretch | after_milestone
  reasons     jsonb not null default '[]'::jsonb,
  blockers    jsonb not null default '[]'::jsonb,
  rationale   text,
  calibrated_fit numeric,
  created_at  timestamptz not null default now(),
  unique (startup_id, thesis_id, target_type, target_id)
);

create table if not exists scores (
  startup_id  text not null references startups(id) on delete cascade,
  thesis_id   text not null references theses(id) on delete cascade,
  promise     numeric not null,
  thesis_fit  numeric,
  breakdown   jsonb not null default '{}'::jsonb,
  headline    text,
  programme   text,                      -- A'Pelago programme fit
  updated_at  timestamptz not null default now(),
  primary key (startup_id, thesis_id)
);

create table if not exists actions (
  id            uuid primary key default gen_random_uuid(),
  startup_id    text not null references startups(id) on delete cascade,
  thesis_id     text references theses(id) on delete cascade,
  horizon       text not null check (horizon in ('now', '30d', '90d')),
  title         text not null,
  detail        text,
  owner         text,                    -- startup | operator
  unlocks       jsonb not null default '[]'::jsonb,
  deadline_date date,
  rank          int,
  created_at    timestamptz not null default now()
);

create table if not exists connections (
  id         uuid primary key default gen_random_uuid(),
  startup_id text not null references startups(id) on delete cascade,
  kind       text not null check (kind in ('warm_path', 'consortium', 'synergy', 'conflict', 'unlock', 'deadline')),
  title      text not null,
  payload    jsonb not null default '{}'::jsonb,
  narrative  text,
  score      numeric,
  created_at timestamptz not null default now()
);

-- ---------- Live pipeline ----------
create table if not exists pipeline_runs (
  id           uuid primary key default gen_random_uuid(),
  startup_id   text references startups(id) on delete cascade,
  status       text not null default 'running' check (status in ('running', 'done', 'error')),
  current_step text,
  error        text,
  started_at   timestamptz not null default now(),
  finished_at  timestamptz
);

create table if not exists pipeline_events (
  id         bigint generated always as identity primary key,
  run_id     uuid not null references pipeline_runs(id) on delete cascade,
  step       text not null,
  agent      text,
  status     text not null check (status in ('started', 'progress', 'done', 'error')),
  message    text,
  payload    jsonb,
  created_at timestamptz not null default now()
);

create index if not exists matches_lookup on matches (startup_id, thesis_id, target_type, rank);
create index if not exists actions_lookup on actions (startup_id, thesis_id, rank);
create index if not exists connections_lookup on connections (startup_id, kind);
create index if not exists events_run on pipeline_events (run_id, id);

-- ---------- RLS: public read, server-only writes (secret key bypasses RLS) ----------
do $$
declare t text;
begin
  foreach t in array array['theses','startups','investors','funding','partners','relationships','assessments',
                           'matches','scores','actions','connections','pipeline_runs','pipeline_events']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "public read" on %I', t);
    execute format('create policy "public read" on %I for select to anon, authenticated using (true)', t);
  end loop;
end $$;

-- ---------- Realtime: live agent feed ----------
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'pipeline_events') then
    alter publication supabase_realtime add table pipeline_events;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'pipeline_runs') then
    alter publication supabase_realtime add table pipeline_runs;
  end if;
end $$;
