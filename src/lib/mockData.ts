import { Chess } from "chess.js";
import type { GameRecord, Profile, SessionState } from "../types";

const sampleProfiles: Profile[] = [
  { id: "u1", displayName: "David", username: "david", email: "david@familien.no", pin: "111111" },
  { id: "u2", displayName: "Mamma", username: "mamma", email: "mamma@familien.no", pin: "222222" },
  { id: "u3", displayName: "Pappa", username: "pappa", email: "pappa@familien.no", pin: "333333" },
  { id: "u4", displayName: "Emma", username: "emma", email: "emma@familien.no", pin: "444444" },
];

function buildDemoGame(): GameRecord {
  const chess = new Chess();
  chess.move("e4");
  chess.move("e5");
  chess.move("Nf3");
  chess.move("Nc6");

  return {
    id: "g1",
    mode: "online",
    status: "active",
    whiteUserId: "u1",
    blackUserId: "u2",
    whiteName: "David",
    blackName: "Mamma",
    currentFen: chess.fen(),
    pgn: chess.pgn(),
    moveHistory: chess.history({ verbose: true }).map((move, index) => ({
      id: `m-${index + 1}`,
      from: move.from,
      to: move.to,
      san: move.san,
      fenAfter: move.after,
      movedByUserId: index % 2 === 0 ? "u1" : "u2",
      createdAt: new Date(Date.now() - (10 - index) * 60000).toISOString(),
    })),
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    lastMoveAt: new Date().toISOString(),
  };
}

function buildLocalGame(): GameRecord {
  const chess = new Chess();

  return {
    id: "g2",
    mode: "local-pass-play",
    status: "active",
    whiteName: "Hvit på denne enheten",
    blackName: "Sort på denne enheten",
    currentFen: chess.fen(),
    pgn: "",
    moveHistory: [],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  };
}

export function getDefaultProfiles(): Profile[] {
  return sampleProfiles;
}

export function getDefaultGames(): GameRecord[] {
  return [buildDemoGame(), buildLocalGame()];
}

export function getDefaultSession(): SessionState {
  return { currentUserId: "u1" };
}
