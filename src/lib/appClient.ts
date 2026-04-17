import { Chess } from "chess.js";
import { getDefaultProfiles } from "./mockData";
import {
  bootstrapLocalData,
  createFamilyProfile,
  createGame as createLocalGame,
  getGameById as getLocalGameById,
  getGames,
  getProfiles,
  getSession,
  getStoredAppSessionToken,
  setCurrentUser,
  setStoredAppSessionToken,
  signInWithFamilyPin,
  updateGame,
} from "./storage";
import { isSupabaseConfigured, supabase } from "./supabase";
import { gameFromRow, profileFromRow, type GameRow, type ProfileRow } from "./gameMappers";
import type { AppSession, GameMode, GameRecord, MoveRecord, Profile } from "../types";

interface AuthResult {
  error?: string;
}

interface AuthState {
  session: AppSession | null;
  profile: Profile | null;
}

interface CreateGameInput {
  mode: GameMode;
  opponentId?: string;
}

interface MoveInput {
  game: GameRecord;
  move: MoveRecord;
  fen: string;
  pgn: string;
}

interface AppSessionRow {
  session_token: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_seed: string | null;
  created_at: string;
  expires_at: string;
}

const LOCAL_AUTH_EVENT = "familiesjakk:auth-changed";

function emitLocalAuthChanged() {
  window.dispatchEvent(new CustomEvent(LOCAL_AUTH_EVENT));
}

function sessionFromRow(row: AppSessionRow): AppSession {
  return {
    token: row.session_token,
    userId: row.user_id,
    username: row.username,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

function profileFromSessionRow(row: AppSessionRow): Profile {
  return {
    id: row.user_id,
    username: row.username,
    displayName: row.display_name,
    avatarSeed: row.avatar_seed ?? row.username,
  };
}

function localAuthState(): AuthState {
  bootstrapLocalData();
  const sessionState = getSession();
  const currentProfile =
    getProfiles().find((profile) => profile.id === sessionState.currentUserId) ?? null;

  if (!currentProfile) {
    return { session: null, profile: null };
  }

  return {
    session: {
      token: "local-session",
      userId: currentProfile.id,
      username: currentProfile.username,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
    },
    profile: currentProfile,
  };
}

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  if (!supabase) {
    throw new Error("Supabase er ikke konfigurert.");
  }

  const { data, error } = await supabase.rpc(fn, args);
  if (error) {
    throw new Error(error.message);
  }

  return data as T;
}

function getCloudToken() {
  return getStoredAppSessionToken();
}

async function getCloudAuthState(): Promise<AuthState> {
  if (!supabase) {
    return localAuthState();
  }

  const token = getCloudToken();
  if (!token) {
    return { session: null, profile: null };
  }

  try {
    const row = await rpc<AppSessionRow | null>("app_get_session", { p_token: token });
    if (!row) {
      setStoredAppSessionToken(null);
      return { session: null, profile: null };
    }

    return {
      session: sessionFromRow(row),
      profile: profileFromSessionRow(row),
    };
  } catch {
    setStoredAppSessionToken(null);
    return { session: null, profile: null };
  }
}

function persistLocalProfile(profile: Profile) {
  const profiles = getProfiles();
  const existingIndex = profiles.findIndex((item) => item.id === profile.id);
  const nextProfiles =
    existingIndex >= 0
      ? profiles.map((item) => (item.id === profile.id ? { ...item, ...profile } : item))
      : [...profiles, profile];

  localStorage.setItem("familiesjakk.profiles", JSON.stringify(nextProfiles));
}

export async function getAuthState(): Promise<AuthState> {
  if (!supabase) {
    return localAuthState();
  }

  return getCloudAuthState();
}

export function subscribeToAuth(callback: (state: AuthState) => void) {
  const handler = () => {
    void (async () => {
      callback(await getAuthState());
    })();
  };

  window.addEventListener(LOCAL_AUTH_EVENT, handler);
  void handler();

  return () => {
    window.removeEventListener(LOCAL_AUTH_EVENT, handler);
  };
}

export function isUsingSupabase() {
  return isSupabaseConfigured();
}

export async function registerWithUsernamePin(
  username: string,
  pin: string,
): Promise<AuthResult> {
  if (!supabase) {
    createFamilyProfile(username, pin);
    const result = signInWithFamilyPin(username, pin);
    if ("error" in result) {
      return { error: result.error };
    }

    emitLocalAuthChanged();
    return {};
  }

  try {
    const row = await rpc<AppSessionRow>("app_register_user", {
      p_username: username,
      p_pin: pin,
    });
    const session = sessionFromRow(row);
    const profile = profileFromSessionRow(row);
    setStoredAppSessionToken(session.token);
    persistLocalProfile(profile);
    setCurrentUser(profile.id);
    emitLocalAuthChanged();
    return {};
  } catch (cause) {
    return { error: cause instanceof Error ? cause.message : "Kunne ikke opprette brukeren." };
  }
}

export async function signInWithUsernamePin(
  username: string,
  pin: string,
): Promise<AuthResult> {
  if (!supabase) {
    const result = signInWithFamilyPin(username, pin);
    if ("error" in result) {
      return { error: result.error };
    }

    emitLocalAuthChanged();
    return {};
  }

  try {
    const row = await rpc<AppSessionRow>("app_login_user", {
      p_username: username,
      p_pin: pin,
    });
    const session = sessionFromRow(row);
    const profile = profileFromSessionRow(row);
    setStoredAppSessionToken(session.token);
    persistLocalProfile(profile);
    setCurrentUser(profile.id);
    emitLocalAuthChanged();
    return {};
  } catch (cause) {
    return { error: cause instanceof Error ? cause.message : "Feil brukernavn eller kode." };
  }
}

export async function signOut(): Promise<AuthResult> {
  const token = getCloudToken();
  setStoredAppSessionToken(null);
  setCurrentUser(null);
  emitLocalAuthChanged();

  if (!supabase || !token) {
    return {};
  }

  try {
    await rpc<boolean>("app_logout_user", { p_token: token });
    return {};
  } catch (cause) {
    return { error: cause instanceof Error ? cause.message : "Kunne ikke logge ut." };
  }
}

export async function listProfiles(): Promise<Profile[]> {
  if (!supabase) {
    return getProfiles();
  }

  const token = getCloudToken();
  if (!token) {
    return getProfiles();
  }

  const rows = await rpc<ProfileRow[]>("app_list_profiles", { p_token: token });
  const cloudProfiles = rows.map(profileFromRow);

  cloudProfiles.forEach(persistLocalProfile);
  return cloudProfiles;
}

export async function listGamesForUser(): Promise<GameRecord[]> {
  const localGames = getGames();

  if (!supabase) {
    return localGames;
  }

  const token = getCloudToken();
  if (!token) {
    return localGames;
  }

  const rows = await rpc<GameRow[]>("app_list_games", { p_token: token });
  const cloudGames = rows.map(gameFromRow);
  cloudGames.forEach(updateGame);
  const seen = new Set(cloudGames.map((game) => game.id));
  const mergedLocalGames = localGames.filter((game) => !seen.has(game.id));
  return [...cloudGames, ...mergedLocalGames];
}

export async function getGameById(gameId: string): Promise<GameRecord | null> {
  if (!supabase) {
    return getLocalGameById(gameId);
  }

  const token = getCloudToken();
  if (!token) {
    return getLocalGameById(gameId);
  }

  const row = await rpc<GameRow | null>("app_get_game", {
    p_token: token,
    p_game_id: gameId,
  });

  if (row) {
    const cloudGame = gameFromRow(row);
    updateGame(cloudGame);
    return cloudGame;
  }

  return getLocalGameById(gameId);
}

export async function createGameForCurrentUser(
  profile: Profile | null,
  profiles: Profile[],
  input: CreateGameInput,
): Promise<GameRecord> {
  const token = getCloudToken();

  if (!supabase || !token || !profile) {
    const fallbackOpponent =
      profiles.find((item) => item.id !== getSession().currentUserId) ?? getDefaultProfiles()[1];

    return createLocalGame({
      mode: input.mode,
      // Online convention: the challenger starts as white, the selected opponent as black.
      whiteUserId: input.mode === "online" ? getSession().currentUserId ?? undefined : undefined,
      blackUserId: input.mode === "online" ? fallbackOpponent?.id : undefined,
      whiteName: input.mode === "online" ? profile?.displayName ?? "Spiller 1" : "Hvit på denne enheten",
      blackName: input.mode === "online" ? fallbackOpponent?.displayName ?? "Spiller 2" : "Sort på denne enheten",
    });
  }

  const row = await rpc<GameRow>("app_create_game", {
    p_token: token,
    p_mode: input.mode,
    p_opponent_id: input.mode === "online" ? input.opponentId ?? null : null,
  });

  const nextGame = gameFromRow(row);
  updateGame(nextGame);
  return nextGame;
}

function deriveGameState(fen: string) {
  const chess = new Chess(fen);

  if (chess.isCheckmate()) {
    return {
      status: "finished" as const,
      result: chess.turn() === "w" ? "0-1" : "1-0",
    };
  }

  if (chess.isDraw()) {
    return {
      status: "finished" as const,
      result: "1/2-1/2",
    };
  }

  return {
    status: "active" as const,
    result: null,
  };
}

export async function saveMove(input: MoveInput): Promise<GameRecord> {
  const nextState = deriveGameState(input.fen);
  const token = getCloudToken();
  const localExistingGame = getLocalGameById(input.game.id);
  const nextLocalGame: GameRecord = {
    ...input.game,
    currentFen: input.fen,
    pgn: input.pgn,
    status: nextState.status,
    result: nextState.result ?? undefined,
    moveHistory: [...input.game.moveHistory, input.move],
    updatedAt: new Date().toISOString(),
    lastMoveAt: new Date().toISOString(),
  };

  const shouldPersistLocally =
    !supabase ||
    !token ||
    (input.game.mode === "local-pass-play" && Boolean(localExistingGame));

  if (shouldPersistLocally) {
    updateGame(nextLocalGame);
    return nextLocalGame;
  }

  try {
    const row = await rpc<GameRow>("app_make_move", {
      p_token: token,
      p_game_id: input.game.id,
      p_from_square: input.move.from,
      p_to_square: input.move.to,
      p_san: input.move.san,
      p_fen_after: input.fen,
      p_pgn: input.pgn,
      p_status: nextState.status,
      p_result: nextState.result,
      p_moved_by_user_id: input.move.movedByUserId ?? null,
    });

    const nextGame = gameFromRow(row);
    updateGame(nextGame);
    return nextGame;
  } catch (cause) {
    if (input.game.mode === "local-pass-play" && localExistingGame) {
      updateGame(nextLocalGame);
      return nextLocalGame;
    }

    throw cause;
  }
}

export function subscribeToGame(gameId: string, callback: () => void) {
  if (!supabase || !getCloudToken()) {
    return () => {};
  }

  const intervalId = window.setInterval(() => {
    void callback();
  }, 3000);

  return () => {
    window.clearInterval(intervalId);
  };
}
