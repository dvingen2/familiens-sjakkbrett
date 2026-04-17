import type { GameRecord, GameStatus, MoveRecord, Profile } from "../types";

interface ProfileRow {
  id: string;
  display_name: string;
  username?: string | null;
  email: string | null;
  avatar_seed?: string | null;
}

interface MoveRow {
  id: string;
  move_number: number;
  from_square: string;
  to_square: string;
  san: string;
  fen_after: string;
  moved_by_user_id: string | null;
  created_at: string;
}

interface GameRow {
  id: string;
  mode: "local-pass-play" | "online";
  status: GameStatus;
  white_user_id: string | null;
  black_user_id: string | null;
  white_name: string;
  black_name: string;
  current_fen: string;
  pgn: string;
  result: string | null;
  created_at: string;
  updated_at: string;
  last_move_at: string | null;
  moves?: MoveRow[];
}

export type { GameRow, MoveRow, ProfileRow };

export function profileFromRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    username: row.username ?? row.display_name.toLowerCase(),
    email: row.email ?? "",
    avatarSeed: row.avatar_seed ?? row.username ?? row.id,
  };
}

export function gameFromRow(row: GameRow): GameRecord {
  return {
    id: row.id,
    mode: row.mode,
    status: row.status,
    whiteUserId: row.white_user_id ?? undefined,
    blackUserId: row.black_user_id ?? undefined,
    whiteName: row.white_name,
    blackName: row.black_name,
    currentFen: row.current_fen,
    pgn: row.pgn,
    result: row.result ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastMoveAt: row.last_move_at ?? undefined,
    moveHistory: (row.moves ?? []).map(moveFromRow),
  };
}

export function moveFromRow(row: MoveRow): MoveRecord {
  return {
    id: row.id,
    from: row.from_square,
    to: row.to_square,
    san: row.san,
    fenAfter: row.fen_after,
    movedByUserId: row.moved_by_user_id ?? undefined,
    createdAt: row.created_at,
  };
}
