import { Chess } from "chess.js";
import { getDefaultGames, getDefaultProfiles, getDefaultSession } from "./mockData";
import type { GameMode, GameRecord, Profile, SessionState } from "../types";

const PROFILES_KEY = "familiesjakk.profiles";
const GAMES_KEY = "familiesjakk.games";
const SESSION_KEY = "familiesjakk.session";
const QUICK_GAME_KEY = "familiesjakk.quick-game-id";
const APP_SESSION_TOKEN_KEY = "familiesjakk.app-session-token";

function readJson<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function bootstrapLocalData() {
  if (!localStorage.getItem(PROFILES_KEY)) {
    writeJson(PROFILES_KEY, getDefaultProfiles());
  }

  if (!localStorage.getItem(GAMES_KEY)) {
    writeJson(GAMES_KEY, getDefaultGames());
  }

  if (!localStorage.getItem(SESSION_KEY)) {
    writeJson(SESSION_KEY, getDefaultSession());
  }
}

export function getProfiles(): Profile[] {
  bootstrapLocalData();
  const profiles = readJson(PROFILES_KEY, getDefaultProfiles());
  const normalizedProfiles = profiles.map((profile) => {
    const username =
      profile.username ||
      profile.displayName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, "")
        .slice(0, 24);

    return {
      ...profile,
      username,
      avatarSeed: profile.avatarSeed ?? username ?? profile.id,
    };
  });

  writeJson(PROFILES_KEY, normalizedProfiles);
  return normalizedProfiles;
}

export function getGames(): GameRecord[] {
  bootstrapLocalData();
  return readJson(GAMES_KEY, getDefaultGames());
}

export function getSession(): SessionState {
  bootstrapLocalData();
  return readJson(SESSION_KEY, getDefaultSession());
}

export function setCurrentUser(userId: string | null) {
  writeJson(SESSION_KEY, { currentUserId: userId });
}

export function getStoredAppSessionToken() {
  return localStorage.getItem(APP_SESSION_TOKEN_KEY);
}

export function setStoredAppSessionToken(token: string | null) {
  if (!token) {
    localStorage.removeItem(APP_SESSION_TOKEN_KEY);
    return;
  }

  localStorage.setItem(APP_SESSION_TOKEN_KEY, token);
}

export function createGame(params: {
  mode: GameMode;
  whiteUserId?: string;
  blackUserId?: string;
  whiteName: string;
  blackName: string;
}): GameRecord {
  const chess = new Chess();
  const games = getGames();

  const game: GameRecord = {
    id: crypto.randomUUID(),
    mode: params.mode,
    status: "active",
    whiteUserId: params.whiteUserId,
    blackUserId: params.blackUserId,
    whiteName: params.whiteName,
    blackName: params.blackName,
    currentFen: chess.fen(),
    pgn: "",
    moveHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  writeJson(GAMES_KEY, [game, ...games]);
  return game;
}

export function updateGame(nextGame: GameRecord) {
  const games = getGames();
  const existingIndex = games.findIndex((game) => game.id === nextGame.id);

  if (existingIndex >= 0) {
    const nextGames = games.map((game) => (game.id === nextGame.id ? nextGame : game));
    writeJson(GAMES_KEY, nextGames);
    return;
  }

  writeJson(GAMES_KEY, [nextGame, ...games]);
}

export function getGameById(gameId: string): GameRecord | null {
  return getGames().find((game) => game.id === gameId) ?? null;
}

export function getOrCreateQuickLocalGame(): GameRecord {
  bootstrapLocalData();
  const gameId = localStorage.getItem(QUICK_GAME_KEY);
  if (gameId) {
    const existing = getGameById(gameId);
    if (existing) {
      return existing;
    }
  }

  const game = createGame({
    mode: "local-pass-play",
    whiteName: "Hvit på denne enheten",
    blackName: "Sort på denne enheten",
  });

  localStorage.setItem(QUICK_GAME_KEY, game.id);
  return game;
}

export function resetQuickLocalGame(): GameRecord {
  const game = createGame({
    mode: "local-pass-play",
    whiteName: "Hvit på denne enheten",
    blackName: "Sort på denne enheten",
  });

  localStorage.setItem(QUICK_GAME_KEY, game.id);
  return game;
}

function normalizeUsername(username: string) {
  return username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 24);
}

export function createFamilyProfile(username: string, pin: string): Profile {
  const normalizedUsername = normalizeUsername(username);
  const displayName = normalizedUsername || "Spiller";
  const profiles = getProfiles();
  const existing = profiles.find(
    (profile) => profile.username.toLowerCase() === normalizedUsername,
  );

  if (existing) {
    const updated = { ...existing, pin };
    const nextProfiles = profiles.map((profile) =>
      profile.id === existing.id ? updated : profile,
    );
    writeJson(PROFILES_KEY, nextProfiles);
    return updated;
  }

  const profile: Profile = {
    id: crypto.randomUUID(),
    displayName,
    username: normalizedUsername,
    email: `${normalizedUsername}@familien.local`,
    pin,
    avatarSeed: normalizedUsername,
  };

  writeJson(PROFILES_KEY, [...profiles, profile]);
  return profile;
}

export function signInWithFamilyPin(username: string, pin: string): { profile: Profile } | { error: string } {
  const normalizedUsername = normalizeUsername(username);
  const profile = getProfiles().find(
    (item) => item.username.trim().toLowerCase() === normalizedUsername,
  );

  if (!profile) {
    return { error: "Fant ingen profil med det brukernavnet." };
  }

  if (!profile.pin || profile.pin !== pin) {
    return { error: "Koden stemmer ikke." };
  }

  setCurrentUser(profile.id);
  return { profile };
}
