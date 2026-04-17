# Username + 6-digit code

## Goal

Replace mixed local PIN and email/password auth with one primary flow:

- choose a username
- choose a 6-digit code
- use the same two fields to sign in later

This keeps the app family-friendly while still giving each player a real online identity,
cloud game history, and cross-device continuity.

## Product decisions

- `username + 6-digit code` is the only visible account flow in the UI
- all named accounts are online accounts when Supabase is configured
- local-only quick play still works from the landing page without login
- account recovery is manual in the backend for now
- global usernames are acceptable in v1

## Architecture

We do not rely on Supabase Auth for the main user flow.

Instead we use:

- `app_users`
- `app_sessions`
- `app_games`
- `app_moves`
- SQL RPC functions exposed through Supabase

The browser only stores an app session token returned by RPC.

## RPC surface

- `app_register_user(username, pin)`
- `app_login_user(username, pin)`
- `app_get_session(token)`
- `app_logout_user(token)`
- `app_list_profiles(token)`
- `app_list_games(token)`
- `app_get_game(token, game_id)`
- `app_create_game(token, mode, opponent_id)`
- `app_make_move(...)`

## Security baseline

- PIN is stored as a hash in Postgres
- session tokens are hashed before storage
- the frontend only sees the raw session token
- game/profile access goes through `token -> user` checks in SQL

## Migration note

Legacy `profiles/games/moves` tables and older auth code can stay in place temporarily while the
new flow rolls out, but the app should now prefer the `app_*` model end to end.

## Related decisions

- See [decision-log.md](./decision-log.md) for broader product and AI-policy decisions.
