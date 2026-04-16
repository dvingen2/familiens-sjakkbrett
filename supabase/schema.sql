create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  email text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  mode text not null check (mode in ('local-pass-play', 'online')),
  status text not null default 'active' check (status in ('pending', 'active', 'finished')),
  created_by uuid not null references public.profiles (id) on delete cascade,
  white_user_id uuid references public.profiles (id) on delete set null,
  black_user_id uuid references public.profiles (id) on delete set null,
  white_name text not null,
  black_name text not null,
  current_fen text not null,
  pgn text not null default '',
  result text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_move_at timestamptz
);

create table if not exists public.moves (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  move_number integer not null check (move_number > 0),
  from_square text not null,
  to_square text not null,
  san text not null,
  fen_after text not null,
  moved_by_user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (game_id, move_number)
);

create index if not exists idx_games_white_user_id on public.games (white_user_id);
create index if not exists idx_games_black_user_id on public.games (black_user_id);
create index if not exists idx_games_updated_at on public.games (updated_at desc);
create index if not exists idx_moves_game_id on public.moves (game_id, move_number);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_games_updated_at on public.games;
create trigger set_games_updated_at
before update on public.games
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1), 'Spiller'),
    coalesce(new.email, '')
  )
  on conflict (id) do update
  set
    display_name = excluded.display_name,
    email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.moves enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "games_select_participants" on public.games;
create policy "games_select_participants"
on public.games
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (
    created_by = (select auth.uid())
    or white_user_id = (select auth.uid())
    or black_user_id = (select auth.uid())
  )
);

drop policy if exists "games_insert_participants" on public.games;
create policy "games_insert_participants"
on public.games
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and created_by = (select auth.uid())
  and (
    white_user_id is null
    or white_user_id = (select auth.uid())
    or black_user_id = (select auth.uid())
  )
);

drop policy if exists "games_update_participants" on public.games;
create policy "games_update_participants"
on public.games
for update
to authenticated
using (
  (select auth.uid()) is not null
  and (
    created_by = (select auth.uid())
    or white_user_id = (select auth.uid())
    or black_user_id = (select auth.uid())
  )
)
with check (
  (select auth.uid()) is not null
  and (
    created_by = (select auth.uid())
    or white_user_id = (select auth.uid())
    or black_user_id = (select auth.uid())
  )
);

drop policy if exists "moves_select_participants" on public.moves;
create policy "moves_select_participants"
on public.moves
for select
to authenticated
using (
  exists (
    select 1
    from public.games
    where public.games.id = moves.game_id
      and (
        public.games.created_by = (select auth.uid())
        or public.games.white_user_id = (select auth.uid())
        or public.games.black_user_id = (select auth.uid())
      )
  )
);

drop policy if exists "moves_insert_participants" on public.moves;
create policy "moves_insert_participants"
on public.moves
for insert
to authenticated
with check (
  exists (
    select 1
    from public.games
    where public.games.id = moves.game_id
      and (
        public.games.created_by = (select auth.uid())
        or public.games.white_user_id = (select auth.uid())
        or public.games.black_user_id = (select auth.uid())
      )
  )
);

alter publication supabase_realtime add table public.games;
alter publication supabase_realtime add table public.moves;
