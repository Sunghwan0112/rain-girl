-- the leaderboard: anyone may add a score and read the list; nobody may change or delete one (only the project's owner, from the dashboard)
create table if not exists public.scores (
  id         bigint generated always as identity primary key,
  name       text    not null check (char_length(name) between 1 and 12),
  score      integer not null check (score between 0 and 40000),      -- (10 rounds at most ~3000 each: more is not a played game)
  round      integer not null check (round between 1 and 10),
  stars      integer not null default 0 check (stars between 0 and 30),
  burnt      integer not null default 0 check (burnt between 0 and 100), -- % of the forest that burned
  won        boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists scores_top on public.scores (score desc, created_at);
alter table public.scores enable row level security;
drop policy if exists "read the board" on public.scores;
create policy "read the board" on public.scores for select to anon using (true);
drop policy if exists "add a score" on public.scores;
create policy "add a score" on public.scores for insert to anon with check (true);
