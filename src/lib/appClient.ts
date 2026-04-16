import { Chess } from "chess.js";
import type { RealtimeChannel, Session, User } from "@supabase/supabase-js";
import { getDefaultGames, getDefaultProfiles, getDefaultSession } from "./mockData";
import {
  bootstrapLocalData,
  createFamilyProfile,
  createGame as createLocalGame,
  getGames,
  getProfiles,
  getSession,
  signInWithFamilyPin,
  setCurrentUser,
  updateGame,
} from "./storage";
import { supabase } from "./supabase";
import { gameFromRow, profileFromRow, type GameRow, type ProfileRow } from "./gameMappers";
import type { GameMode, GameRecord, MoveRecord, Profile } from "../types";

interface AuthResult {
  error?: string;
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

const LOCAL_AUTH_EVENT = "familiesjakk:auth-changed";

function emitLocalAuthChanged() {
  window.dispatchEvent(new CustomEvent(LOCAL_AUTH_EVENT));
}

async function getCloudSession() {
  if (!supabase) {
    return null;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}

function ensureLocalProfileForUser(user: User) {
  const profiles = getProfiles();
  if (profiles.some((profile) => profile.id === user.id)) {
    setCurrentUser(user.id);
    emitLocalAuthChanged();
    return;
  }

  const nextProfiles = [
    ...profiles,
    {
      id: user.id,
      displayName:
        user.user_metadata?.display_name ||
        user.email?.split("@")[0] ||
        "Ny bruker",
      email: user.email ?? "",
    },
  ];

  localStorage.setItem("familiesjakk.profiles", JSON.stringify(nextProfiles));
  setCurrentUser(user.id);
  emitLocalAuthChanged();
}

function localSessionToAuthState(): { session: Session | null; user: User | null } {
  bootstrapLocalData();
  const sessionState = getSession();
  const currentUser = getProfiles().find((profile) => profile.id === sessionState.currentUserId);
  if (!currentUser) {
    return { session: null, user: null };
  }

  return {
    session: null,
    user: {
      id: currentUser.id,
      app_metadata: {},
      user_metadata: { display_name: currentUser.displayName },
      aud: "authenticated",
      created_at: new Date().toISOString(),
      email: currentUser.email,
    } as User,
  };
}

export async function getAuthState(): Promise<{ session: Session | null; user: User | null }> {
  if (!supabase) {
    return localSessionToAuthState();
  }

  const session = await getCloudSession();

  if (!session) {
    return localSessionToAuthState();
  }

  return { session, user: session.user ?? null };
}

export function subscribeToAuth(callback: (session: Session | null, user: User | null) => void) {
  if (!supabase) {
    const local = localSessionToAuthState();
    callback(local.session, local.user);
    const handler = () => {
      const nextLocal = localSessionToAuthState();
      callback(nextLocal.session, nextLocal.user);
    };
    window.addEventListener(LOCAL_AUTH_EVENT, handler);
    return () => {
      window.removeEventListener(LOCAL_AUTH_EVENT, handler);
    };
  }

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    if (!session) {
      const local = localSessionToAuthState();
      callback(local.session, local.user);
      return;
    }
    callback(session, session.user ?? null);
  });

  return () => {
    data.subscription.unsubscribe();
  };
}

export async function signUp(params: {
  email: string;
  password: string;
  displayName: string;
}): Promise<AuthResult> {
  if (!supabase) {
    const fakeUser: User = {
      id: crypto.randomUUID(),
      app_metadata: {},
      user_metadata: { display_name: params.displayName },
      aud: "authenticated",
      created_at: new Date().toISOString(),
      email: params.email,
    } as User;
    ensureLocalProfileForUser(fakeUser);
    return {};
  }

  const { error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        display_name: params.displayName,
      },
      emailRedirectTo: window.location.href,
    },
  });

  return error ? { error: error.message } : {};
}

export async function signIn(params: { email: string; password: string }): Promise<AuthResult> {
  if (!supabase) {
    return { error: "Bruk familieprofil + PIN for lokal innlogging." };
  }

  const { error } = await supabase.auth.signInWithPassword(params);
  return error ? { error: error.message } : {};
}

export async function signOut(): Promise<AuthResult> {
  setCurrentUser(null);
  emitLocalAuthChanged();

  if (!supabase) {
    return {};
  }

  const { error } = await supabase.auth.signOut({ scope: "local" });
  return error ? { error: error.message } : {};
}

export async function signInFamily(displayName: string, pin: string): Promise<AuthResult> {
  const result = signInWithFamilyPin(displayName, pin);
  if ("error" in result) {
    return { error: result.error };
  }

  emitLocalAuthChanged();
  return {};
}

export async function registerFamily(displayName: string, pin: string): Promise<AuthResult> {
  createFamilyProfile(displayName, pin);
  const result = signInWithFamilyPin(displayName, pin);
  if ("error" in result) {
    return { error: result.error };
  }

  emitLocalAuthChanged();
  return {};
}

export async function ensureProfile(user: User): Promise<Profile> {
  const session = await getCloudSession();

  if (!supabase || !session || session.user.id !== user.id) {
    ensureLocalProfileForUser(user);
    return (
      getProfiles().find((profile) => profile.id === user.id) ?? getDefaultProfiles()[0]
    );
  }

  const displayName =
    user.user_metadata?.display_name ||
    user.email?.split("@")[0] ||
    "Spiller";

  const profilePayload = {
    id: user.id,
    display_name: displayName,
    email: user.email ?? "",
  };

  const { error } = await supabase.from("profiles").upsert(profilePayload);
  if (error) {
    throw error;
  }

  const { data, error: selectError } = await supabase
    .from("profiles")
    .select("id, display_name, email")
    .eq("id", user.id)
    .single();

  if (selectError) {
    throw selectError;
  }

  return profileFromRow(data as ProfileRow);
}

export async function listProfiles(): Promise<Profile[]> {
  if (!supabase) {
    return getProfiles();
  }

  const session = await getCloudSession();
  if (!session) {
    return getProfiles();
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, email")
    .order("display_name");

  if (error) {
    throw error;
  }

  return (data as ProfileRow[]).map(profileFromRow);
}

export async function listGamesForUser(): Promise<GameRecord[]> {
  if (!supabase) {
    return getGames();
  }

  const session = await getCloudSession();
  if (!session) {
    return getGames();
  }

  const { data, error } = await supabase
    .from("games")
    .select(
      "id, mode, status, white_user_id, black_user_id, white_name, black_name, current_fen, pgn, result, created_at, updated_at, last_move_at",
    )
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data as GameRow[]).map(gameFromRow);
}

export async function getGameById(gameId: string): Promise<GameRecord | null> {
  if (!supabase) {
    return getGames().find((item) => item.id === gameId) ?? null;
  }

  const session = await getCloudSession();
  if (!session) {
    return getGames().find((item) => item.id === gameId) ?? null;
  }

  const { data, error } = await supabase
    .from("games")
    .select(
      "id, mode, status, white_user_id, black_user_id, white_name, black_name, current_fen, pgn, result, created_at, updated_at, last_move_at, moves(id, move_number, from_square, to_square, san, fen_after, moved_by_user_id, created_at)",
    )
    .eq("id", gameId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return gameFromRow(data as GameRow);
}

export async function createGameForCurrentUser(
  user: User | null,
  profiles: Profile[],
  input: CreateGameInput,
): Promise<GameRecord> {
  const session = await getCloudSession();

  if (!supabase || !user || !session || session.user.id !== user.id) {
    const fallbackOpponent =
      profiles.find((profile) => profile.id !== getSession().currentUserId) ?? getDefaultProfiles()[1];

    return createLocalGame({
      mode: input.mode,
      whiteUserId: input.mode === "online" ? getSession().currentUserId ?? undefined : undefined,
      blackUserId: input.mode === "online" ? fallbackOpponent?.id : undefined,
      whiteName:
        input.mode === "online"
          ? profiles.find((profile) => profile.id === getSession().currentUserId)?.displayName ??
            "Spiller 1"
          : "Hvit på denne enheten",
      blackName:
        input.mode === "online"
          ? fallbackOpponent?.displayName ?? "Spiller 2"
          : "Sort på denne enheten",
    });
  }

  const chess = new Chess();
  const opponent = profiles.find((profile) => profile.id === input.opponentId) ?? null;

  const payload = {
    mode: input.mode,
    status: "active" as const,
    created_by: user.id,
    white_user_id: input.mode === "online" ? user.id : null,
    black_user_id: input.mode === "online" ? opponent?.id ?? null : null,
    white_name:
      input.mode === "online"
        ? profiles.find((profile) => profile.id === user.id)?.displayName ??
          user.user_metadata?.display_name ??
          "Spiller 1"
        : "Hvit på denne enheten",
    black_name:
      input.mode === "online"
        ? opponent?.displayName ?? "Spiller 2"
        : "Sort på denne enheten",
    current_fen: chess.fen(),
    pgn: "",
  };

  const { data, error } = await supabase
    .from("games")
    .insert(payload)
    .select(
      "id, mode, status, white_user_id, black_user_id, white_name, black_name, current_fen, pgn, result, created_at, updated_at, last_move_at",
    )
    .single();

  if (error) {
    throw error;
  }

  return gameFromRow(data as GameRow);
}

export async function saveMove(input: MoveInput): Promise<GameRecord> {
  const session = await getCloudSession();

  if (!supabase || !session) {
    const nextGame: GameRecord = {
      ...input.game,
      currentFen: input.fen,
      pgn: input.pgn,
      moveHistory: [...input.game.moveHistory, input.move],
      updatedAt: new Date().toISOString(),
      lastMoveAt: new Date().toISOString(),
    };
    updateGame(nextGame);
    return nextGame;
  }

  const { error: moveError } = await supabase.from("moves").insert({
    game_id: input.game.id,
    move_number: input.game.moveHistory.length + 1,
    from_square: input.move.from,
    to_square: input.move.to,
    san: input.move.san,
    fen_after: input.move.fenAfter,
    moved_by_user_id: input.move.movedByUserId ?? null,
  });

  if (moveError) {
    throw moveError;
  }

  const nextStatus =
    (() => {
      const chess = new Chess(input.fen);
      if (chess.isGameOver()) {
        return "finished" as const;
      }
      return input.game.status;
    })();

  const { error: gameError } = await supabase
    .from("games")
    .update({
      current_fen: input.fen,
      pgn: input.pgn,
      status: nextStatus,
      updated_at: new Date().toISOString(),
      last_move_at: new Date().toISOString(),
    })
    .eq("id", input.game.id);

  if (gameError) {
    throw gameError;
  }

  const nextGame = await getGameById(input.game.id);
  if (!nextGame) {
    throw new Error("Fant ikke oppdatert spill etter lagring.");
  }
  return nextGame;
}

export function subscribeToGame(gameId: string, callback: () => void): (() => void) {
  if (!supabase) {
    return () => undefined;
  }

  void getCloudSession().then((session) => {
    if (!session) {
      return;
    }
  });

  const client = supabase;

  const channel: RealtimeChannel = client
    .channel(`game-${gameId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "games", filter: `id=eq.${gameId}` },
      callback,
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "moves", filter: `game_id=eq.${gameId}` },
      callback,
    )
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}

export function isUsingSupabase() {
  return Boolean(supabase);
}
