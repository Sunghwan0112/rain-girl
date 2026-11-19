-- THE LEADERBOARD (Supabase: run this once in the project's SQL editor; running it again is safe).
-- Anyone may read the board and add a score; nobody may change or delete one (only the project's owner, from the dashboard).
-- A player signed in with GitHub is shown by their GitHub name - the database takes it from their sign-in, so nobody can post as
-- someone else; a guest types a name. What the game sends is checked here, not trusted: a score has to be one a played game can make.

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
alter table public.scores add column if not exists user_id uuid references auth.users on delete set null;
alter table public.scores add column if not exists github  text;      -- (their GitHub login, when signed in: shown with a mark)
create index if not exists scores_top   on public.scores (score desc, created_at);
create index if not exists scores_month on public.scores (created_at, score desc);

-- what a score may be: filled in and checked by the database itself
create or replace function public.score_in() returns trigger language plpgsql security definer set search_path = public as $$
declare who text;
begin
  new.user_id := auth.uid();
  who := case when auth.uid() is null then null
              else coalesce(auth.jwt() -> 'user_metadata' ->> 'user_name', auth.jwt() -> 'user_metadata' ->> 'preferred_username') end;
  new.github := who;
  if who is not null then new.name := left(who, 12); end if;                         -- (signed in: their own name, always)
  new.name := btrim(regexp_replace(new.name, '[[:cntrl:]]', '', 'g'));
  if new.name = '' then new.name := '???'; end if;
  new.created_at := now();                                                           -- (not the game's clock)
  if new.won and new.round <> 10 then raise exception 'a won game ends in round 10'; end if;
  if new.score > new.round * 3200 then raise exception 'more than % rounds can score', new.round; end if;
  if new.stars > new.round * 3 then raise exception 'three stars a round at most'; end if;
  -- (a brake: one score every 20 s from one signed-in player)
  if new.user_id is not null and exists (select 1 from public.scores where user_id = new.user_id and created_at > now() - interval '20 seconds') then
    raise exception 'one score at a time';
  end if;
  return new;
end $$;
drop trigger if exists score_in on public.scores;
create trigger score_in before insert on public.scores for each row execute function public.score_in();

alter table public.scores enable row level security;
drop policy if exists "read the board" on public.scores;
create policy "read the board" on public.scores for select to anon, authenticated using (true);
drop policy if exists "add a score" on public.scores;
create policy "add a score" on public.scores for insert to anon, authenticated with check (true);
grant select, insert on public.scores to anon, authenticated;
revoke update, delete on public.scores from anon, authenticated;
