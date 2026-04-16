import { Chess, type PieceSymbol, type Square } from "chess.js";
import type { MoveRecord, Side } from "../types";

export const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
export const RANKS = [8, 7, 6, 5, 4, 3, 2, 1] as const;

export const PIECE_SYMBOLS: Record<Side, Record<PieceSymbol, string>> = {
  w: {
    p: "♙",
    n: "♘",
    b: "♗",
    r: "♖",
    q: "♕",
    k: "♔",
  },
  b: {
    p: "♟",
    n: "♞",
    b: "♝",
    r: "♜",
    q: "♛",
    k: "♚",
  },
};

export function listSquares(): Square[] {
  return RANKS.flatMap((rank) =>
    FILES.map((file) => `${file}${rank}` as Square),
  );
}

export function legalMovesForSquare(fen: string, square: Square): Square[] {
  const chess = new Chess(fen);
  return chess.moves({ square, verbose: true }).map((move) => move.to);
}

export function attemptMove(
  fen: string,
  from: Square,
  to: Square,
  currentUserId?: string,
): { ok: true; fen: string; pgn: string; move: MoveRecord } | { ok: false } {
  const chess = new Chess(fen);
  const move = chess.move({ from, to, promotion: "q" });

  if (!move) {
    return { ok: false };
  }

  return {
    ok: true,
    fen: chess.fen(),
    pgn: chess.pgn(),
    move: {
      id: crypto.randomUUID(),
      from,
      to,
      san: move.san,
      fenAfter: chess.fen(),
      movedByUserId: currentUserId,
      createdAt: new Date().toISOString(),
    },
  };
}

export function getTurn(fen: string): Side {
  return new Chess(fen).turn();
}

export function getStatusText(fen: string): string {
  const chess = new Chess(fen);

  if (chess.isCheckmate()) {
    return `Sjakk matt - ${chess.turn() === "w" ? "sort" : "hvit"} vant`;
  }

  if (chess.isDraw()) {
    return "Remis";
  }

  if (chess.inCheck()) {
    return `Sjakk - ${chess.turn() === "w" ? "hvit" : "sort"} i trekk`;
  }

  return `${chess.turn() === "w" ? "Hvit" : "Sort"} i trekk`;
}

export function getFriendlyGameMessage(fen: string, moveCount: number): string {
  const chess = new Chess(fen);

  if (chess.isCheckmate()) {
    return chess.turn() === "w"
      ? "Sterk avslutning. Sort satte matt og fullførte partiet."
      : "Sterk avslutning. Hvit satte matt og fullførte partiet.";
  }

  if (chess.isDraw()) {
    return "Partiet endte uavgjort. Bra kjempet begge to.";
  }

  if (moveCount === 0) {
    return "Alt er klart. Bare start, så er partiet i gang.";
  }

  if (moveCount < 6) {
    return "Fin start. Nå begynner stillingen å ta form.";
  }

  if (chess.inCheck()) {
    return "Kongen er truet. Nå gjelder det å finne et rolig og smart trekk.";
  }

  return "Partiet lever fortsatt. Fortsett å passe på kongen og de løse brikkene.";
}
