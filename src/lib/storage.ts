import { Chess } from "chess.js";
import { getDefaultGames, getDefaultProfiles, getDefaultSession } from "./mockData";
import type { GameMode, GameRecord, Profile, SessionState } from "../types";

const PROFILES_KEY = "familiesjakk.profiles";
const GAMES_KEY = "familiesjakk.games";
const SESSION_KEY = "familiesjakk.session";

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
  return readJson(PROFILES_KEY, getDefaultProfiles());
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
  const games = getGames().map((game) => (game.id === nextGame.id ? nextGame : game));
  writeJson(GAMES_KEY, games);
}
