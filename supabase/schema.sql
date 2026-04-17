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

do $$
begin
  alter publication supabase_realtime add table public.games;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.moves;
exception
  when duplicate_object then null;
end $$;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  display_name text not null,
  pin_hash text not null,
  avatar_seed text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  last_login_at timestamptz,
  constraint app_users_username_format check (username ~ '^[a-z0-9._-]{3,24}$')
);

create table if not exists public.app_sessions (
  token_hash text primary key,
  user_id uuid not null references public.app_users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.app_games (
  id uuid primary key default gen_random_uuid(),
  mode text not null check (mode in ('local-pass-play', 'online')),
  status text not null default 'active' check (status in ('pending', 'active', 'finished')),
  created_by uuid not null references public.app_users (id) on delete cascade,
  white_user_id uuid references public.app_users (id) on delete set null,
  black_user_id uuid references public.app_users (id) on delete set null,
  white_name text not null,
  black_name text not null,
  current_fen text not null,
  pgn text not null default '',
  result text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_move_at timestamptz
);

create table if not exists public.app_moves (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.app_games (id) on delete cascade,
  move_number integer not null check (move_number > 0),
  from_square text not null,
  to_square text not null,
  san text not null,
  fen_after text not null,
  moved_by_user_id uuid references public.app_users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (game_id, move_number)
);

create index if not exists idx_app_sessions_user_id on public.app_sessions (user_id);
create index if not exists idx_app_sessions_expires_at on public.app_sessions (expires_at);
create index if not exists idx_app_games_updated_at on public.app_games (updated_at desc);
create index if not exists idx_app_games_white_user_id on public.app_games (white_user_id);
create index if not exists idx_app_games_black_user_id on public.app_games (black_user_id);
create index if not exists idx_app_moves_game_id on public.app_moves (game_id, move_number);

alter table public.app_users enable row level security;
alter table public.app_sessions enable row level security;
alter table public.app_games enable row level security;
alter table public.app_moves enable row level security;

drop trigger if exists set_app_games_updated_at on public.app_games;
create trigger set_app_games_updated_at
before update on public.app_games
for each row
execute function public.set_updated_at();

create or replace function public.app_normalize_username(p_username text)
returns text
language sql
immutable
as $$
  select substring(regexp_replace(lower(trim(coalesce(p_username, ''))), '[^a-z0-9._-]', '', 'g') from 1 for 24)
$$;

create or replace function public.app_issue_session(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
  v_token text;
  v_expires_at timestamptz;
begin
  select * into v_user
  from public.app_users
  where id = p_user_id;

  if not found then
    raise exception 'Fant ikke brukeren.';
  end if;

  v_token := encode(extensions.gen_random_bytes(24), 'hex');
  v_expires_at := timezone('utc', now()) + interval '90 days';

  insert into public.app_sessions (token_hash, user_id, expires_at)
  values (encode(extensions.digest(v_token, 'sha256'), 'hex'), v_user.id, v_expires_at);

  update public.app_users
  set last_login_at = timezone('utc', now())
  where id = v_user.id;

  return jsonb_build_object(
    'session_token', v_token,
    'user_id', v_user.id,
    'username', v_user.username,
    'display_name', v_user.display_name,
    'avatar_seed', v_user.avatar_seed,
    'created_at', timezone('utc', now()),
    'expires_at', v_expires_at
  );
end;
$$;

create or replace function public.app_require_user_id(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if p_token is null or length(trim(p_token)) = 0 then
    raise exception 'Logg inn for å fortsette.';
  end if;

  select app_sessions.user_id into v_user_id
  from public.app_sessions
  where token_hash = encode(extensions.digest(trim(p_token), 'sha256'), 'hex')
    and expires_at > timezone('utc', now());

  if v_user_id is null then
    raise exception 'Sesjonen er ikke gyldig lenger.';
  end if;

  update public.app_sessions
  set last_seen_at = timezone('utc', now())
  where token_hash = encode(extensions.digest(trim(p_token), 'sha256'), 'hex');

  return v_user_id;
end;
$$;

create or replace function public.app_build_game_payload(p_game_id uuid)
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'id', g.id,
    'mode', g.mode,
    'status', g.status,
    'white_user_id', g.white_user_id,
    'black_user_id', g.black_user_id,
    'white_name', g.white_name,
    'black_name', g.black_name,
    'current_fen', g.current_fen,
    'pgn', g.pgn,
    'result', g.result,
    'created_at', g.created_at,
    'updated_at', g.updated_at,
    'last_move_at', g.last_move_at,
    'moves', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', m.id,
          'move_number', m.move_number,
          'from_square', m.from_square,
          'to_square', m.to_square,
          'san', m.san,
          'fen_after', m.fen_after,
          'moved_by_user_id', m.moved_by_user_id,
          'created_at', m.created_at
        )
        order by m.move_number
      )
      from public.app_moves m
      where m.game_id = g.id
    ), '[]'::jsonb)
  )
  from public.app_games g
  where g.id = p_game_id
$$;

create or replace function public.app_register_user(p_username text, p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_user_id uuid;
begin
  v_username := public.app_normalize_username(p_username);

  if v_username !~ '^[a-z0-9._-]{3,24}$' then
    raise exception 'Brukernavnet må være 3 til 24 tegn og kan bare bruke bokstaver, tall, punktum, bindestrek eller understrek.';
  end if;

  if coalesce(p_pin, '') !~ '^[0-9]{6}$' then
    raise exception 'Koden må være nøyaktig 6 sifre.';
  end if;

  if exists (
    select 1
    from public.app_users
    where username = v_username
  ) then
    raise exception 'Brukernavnet er allerede tatt.';
  end if;

  insert into public.app_users (username, display_name, pin_hash, avatar_seed)
  values (
    v_username,
    v_username,
    extensions.crypt(p_pin, extensions.gen_salt('bf')),
    v_username
  )
  returning id into v_user_id;

  return public.app_issue_session(v_user_id);
end;
$$;

create or replace function public.app_login_user(p_username text, p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_user public.app_users%rowtype;
begin
  v_username := public.app_normalize_username(p_username);

  select * into v_user
  from public.app_users
  where username = v_username;

  if not found or extensions.crypt(coalesce(p_pin, ''), v_user.pin_hash) <> v_user.pin_hash then
    raise exception 'Feil brukernavn eller kode.';
  end if;

  return public.app_issue_session(v_user.id);
end;
$$;

create or replace function public.app_get_session(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_user public.app_users%rowtype;
begin
  if p_token is null or length(trim(p_token)) = 0 then
    return null;
  end if;

  select public.app_require_user_id(p_token) into v_user_id;

  select * into v_user
  from public.app_users
  where id = v_user_id;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'session_token', trim(p_token),
    'user_id', v_user.id,
    'username', v_user.username,
    'display_name', v_user.display_name,
    'avatar_seed', v_user.avatar_seed,
    'created_at', timezone('utc', now()),
    'expires_at', (
      select expires_at
      from public.app_sessions
      where token_hash = encode(extensions.digest(trim(p_token), 'sha256'), 'hex')
    )
  );
exception
  when others then
    return null;
end;
$$;

create or replace function public.app_logout_user(p_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_token is null or length(trim(p_token)) = 0 then
    return true;
  end if;

  delete from public.app_sessions
  where token_hash = encode(extensions.digest(trim(p_token), 'sha256'), 'hex');

  return true;
end;
$$;

create or replace function public.app_list_profiles(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  v_user_id := public.app_require_user_id(p_token);

  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', u.id,
        'display_name', u.display_name,
        'username', u.username,
        'email', null,
        'avatar_seed', u.avatar_seed
      )
      order by u.username
    )
    from public.app_users u
  ), '[]'::jsonb);
end;
$$;

create or replace function public.app_list_games(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  v_user_id := public.app_require_user_id(p_token);

  return coalesce((
    select jsonb_agg(public.app_build_game_payload(g.id) order by g.updated_at desc)
    from public.app_games g
    where g.created_by = v_user_id
      or g.white_user_id = v_user_id
      or g.black_user_id = v_user_id
  ), '[]'::jsonb);
end;
$$;

create or replace function public.app_get_game(p_token text, p_game_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  v_user_id := public.app_require_user_id(p_token);

  if not exists (
    select 1
    from public.app_games g
    where g.id = p_game_id
      and (
        g.created_by = v_user_id
        or g.white_user_id = v_user_id
        or g.black_user_id = v_user_id
      )
  ) then
    return null;
  end if;

  return public.app_build_game_payload(p_game_id);
end;
$$;

create or replace function public.app_create_game(
  p_token text,
  p_mode text,
  p_opponent_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_user public.app_users%rowtype;
  v_opponent public.app_users%rowtype;
  v_game_id uuid;
begin
  v_user_id := public.app_require_user_id(p_token);

  if p_mode not in ('local-pass-play', 'online') then
    raise exception 'Ugyldig spillmodus.';
  end if;

  select * into v_user
  from public.app_users
  where id = v_user_id;

  if p_mode = 'online' then
    if p_opponent_id is null then
      raise exception 'Velg en motspiller.';
    end if;

    select * into v_opponent
    from public.app_users
    where id = p_opponent_id;

    if not found then
      raise exception 'Fant ikke motspilleren.';
    end if;
  end if;

  insert into public.app_games (
    mode,
    status,
    created_by,
    white_user_id,
    black_user_id,
    white_name,
    black_name,
    current_fen,
    pgn
  )
  values (
    p_mode,
    'active',
    v_user_id,
    case when p_mode = 'online' then v_user_id else null end,
    case when p_mode = 'online' then p_opponent_id else null end,
    case when p_mode = 'online' then v_user.display_name else 'Hvit på denne enheten' end,
    case when p_mode = 'online' then v_opponent.display_name else 'Sort på denne enheten' end,
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    ''
  )
  returning id into v_game_id;

  return public.app_build_game_payload(v_game_id);
end;
$$;

create or replace function public.app_make_move(
  p_token text,
  p_game_id uuid,
  p_from_square text,
  p_to_square text,
  p_san text,
  p_fen_after text,
  p_pgn text,
  p_status text,
  p_result text default null,
  p_moved_by_user_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_next_move_number integer;
begin
  v_user_id := public.app_require_user_id(p_token);

  if not exists (
    select 1
    from public.app_games g
    where g.id = p_game_id
      and (
        g.created_by = v_user_id
        or g.white_user_id = v_user_id
        or g.black_user_id = v_user_id
      )
  ) then
    raise exception 'Du har ikke tilgang til dette spillet.';
  end if;

  select coalesce(max(move_number), 0) + 1 into v_next_move_number
  from public.app_moves
  where game_id = p_game_id;

  insert into public.app_moves (
    game_id,
    move_number,
    from_square,
    to_square,
    san,
    fen_after,
    moved_by_user_id
  )
  values (
    p_game_id,
    v_next_move_number,
    p_from_square,
    p_to_square,
    p_san,
    p_fen_after,
    coalesce(p_moved_by_user_id, v_user_id)
  );

  update public.app_games
  set
    current_fen = p_fen_after,
    pgn = p_pgn,
    status = coalesce(p_status, 'active'),
    result = p_result,
    last_move_at = timezone('utc', now()),
    updated_at = timezone('utc', now())
  where id = p_game_id;

  return public.app_build_game_payload(p_game_id);
end;
$$;

grant execute on function public.app_register_user(text, text) to anon, authenticated;
grant execute on function public.app_login_user(text, text) to anon, authenticated;
grant execute on function public.app_get_session(text) to anon, authenticated;
grant execute on function public.app_logout_user(text) to anon, authenticated;
grant execute on function public.app_list_profiles(text) to anon, authenticated;
grant execute on function public.app_list_games(text) to anon, authenticated;
grant execute on function public.app_get_game(text, uuid) to anon, authenticated;
grant execute on function public.app_create_game(text, text, uuid) to anon, authenticated;
grant execute on function public.app_make_move(text, uuid, text, text, text, text, text, text, text, uuid) to anon, authenticated;
