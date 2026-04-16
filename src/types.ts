export type GameMode = "local-pass-play" | "online";
export type GameStatus = "pending" | "active" | "finished";
export type Side = "w" | "b";

export interface Profile {
  id: string;
  displayName: string;
  email: string;
}

export interface MoveRecord {
  id: string;
  from: string;
  to: string;
  san: string;
  fenAfter: string;
  movedByUserId?: string;
  createdAt: string;
}

export interface GameRecord {
  id: string;
  mode: GameMode;
  status: GameStatus;
  whiteUserId?: string;
  blackUserId?: string;
  whiteName: string;
  blackName: string;
  currentFen: string;
  pgn: string;
  moveHistory: MoveRecord[];
  createdAt: string;
  updatedAt: string;
  lastMoveAt?: string;
  result?: string;
}

export interface SessionState {
  currentUserId: string | null;
}
