import { Chess } from "chess.js";
import type { GameRecord, Profile } from "../types";

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  goal: number;
  progress: number;
  completed: boolean;
}

export interface GamificationSnapshot {
  earnedBadges: BadgeDefinition[];
  nextBadges: BadgeDefinition[];
  weeklyChallenge: WeeklyChallenge;
}

const BADGES: BadgeDefinition[] = [
  {
    id: "first-move",
    title: "Første trekk",
    description: "Familien har satt de første brikkene i bevegelse.",
  },
  {
    id: "first-finish",
    title: "Partiet i boks",
    description: "Dere fullførte et helt parti sammen.",
  },
  {
    id: "ten-moves",
    title: "Skikkelig i gang",
    description: "Et parti nådde minst 10 trekk.",
  },
  {
    id: "first-checkmate",
    title: "Sjakk matt!",
    description: "Familien satte sin første matt i appen.",
  },
  {
    id: "three-games",
    title: "Familierunde",
    description: "Tre partier er spilt ferdig.",
  },
];

const CHALLENGE_TEMPLATES = [
  {
    id: "play-two-games",
    title: "Ukas familiesjakk",
    description: "Spill ferdig to partier denne uka.",
    goal: 2,
    measure: (games: GameRecord[]) => games.filter(isFinishedGame).length,
  },
  {
    id: "make-twelve-moves",
    title: "Hold partiet i live",
    description: "Kom opp i totalt 12 trekk denne uka.",
    goal: 12,
    measure: (games: GameRecord[]) =>
      games.reduce((sum, game) => sum + game.moveHistory.length, 0),
  },
  {
    id: "finish-one-local",
    title: "Kjøkkenbord-duell",
    description: "Fullfør ett lokalt parti på samme enhet denne uka.",
    goal: 1,
    measure: (games: GameRecord[]) =>
      games.filter((game) => game.mode === "local-pass-play" && isFinishedGame(game)).length,
  },
];

export function getGamificationSnapshot(games: GameRecord[], profile?: Profile | null): GamificationSnapshot {
  const earnedBadgeIds = new Set<string>();

  if (games.some((game) => game.moveHistory.length > 0)) {
    earnedBadgeIds.add("first-move");
  }

  if (games.some(isFinishedGame)) {
    earnedBadgeIds.add("first-finish");
  }

  if (games.some((game) => game.moveHistory.length >= 10)) {
    earnedBadgeIds.add("ten-moves");
  }

  if (games.some(isCheckmateGame)) {
    earnedBadgeIds.add("first-checkmate");
  }

  if (games.filter(isFinishedGame).length >= 3) {
    earnedBadgeIds.add("three-games");
  }

  const earnedBadges = BADGES.filter((badge) => earnedBadgeIds.has(badge.id));
  const nextBadges = BADGES.filter((badge) => !earnedBadgeIds.has(badge.id)).slice(0, 3);

  const weeklyTemplate = getWeeklyTemplate();
  const weeklyGames = getGamesFromCurrentWeek(games);
  const progress = Math.min(weeklyTemplate.goal, weeklyTemplate.measure(weeklyGames));

  return {
    earnedBadges,
    nextBadges,
    weeklyChallenge: {
      id: weeklyTemplate.id,
      title: weeklyTemplate.title,
      description: profile
        ? `${weeklyTemplate.description} ${profile.displayName} kan hjelpe familien i mål.`
        : weeklyTemplate.description,
      goal: weeklyTemplate.goal,
      progress,
      completed: progress >= weeklyTemplate.goal,
    },
  };
}

export function getPostGameFeedback(game: GameRecord) {
  const chess = new Chess(game.currentFen);
  const moveCount = game.moveHistory.length;

  if (chess.isCheckmate()) {
    return {
      title: "For en avslutning",
      body:
        chess.turn() === "w"
          ? "Sort fant matt. Kanskje dere vil ha en rematch med byttede farger?"
          : "Hvit fant matt. Kanskje dere vil ha en rematch med byttede farger?",
      tone: "celebration" as const,
    };
  }

  if (chess.isDraw()) {
    return {
      title: "God kamp",
      body: "Dette ble helt jevnt. En ny runde kan vippe det i begge retninger.",
      tone: "warm" as const,
    };
  }

  if (moveCount === 0) {
    return {
      title: "Klar for første trekk",
      body: "Helt åpningsklart. Bare trykk i gang.",
      tone: "warm" as const,
    };
  }

  if (moveCount < 6) {
    return {
      title: "Fin åpning",
      body: "Brikkene kommer ut. Nå gjelder det å bygge en trygg stilling.",
      tone: "warm" as const,
    };
  }

  if (chess.inCheck()) {
    return {
      title: "Spennende nå",
      body: "Kongen er truet. Dette er et perfekt øyeblikk for å tenke rolig sammen.",
      tone: "alert" as const,
    };
  }

  return {
    title: "Partiet lever",
    body: "Mye kan fortsatt skje. Se etter løse brikker og smarte bytter.",
    tone: "warm" as const,
  };
}

function isFinishedGame(game: GameRecord) {
  const chess = new Chess(game.currentFen);
  return chess.isGameOver() || game.status === "finished";
}

function isCheckmateGame(game: GameRecord) {
  const chess = new Chess(game.currentFen);
  return chess.isCheckmate();
}

function getWeeklyTemplate() {
  const now = new Date();
  const weekNumber = getWeekNumber(now);
  return CHALLENGE_TEMPLATES[weekNumber % CHALLENGE_TEMPLATES.length];
}

function getGamesFromCurrentWeek(games: GameRecord[]) {
  const now = new Date();
  const currentWeek = getWeekNumber(now);
  const currentYear = now.getFullYear();

  return games.filter((game) => {
    const updatedAt = new Date(game.updatedAt);
    return (
      updatedAt.getFullYear() === currentYear &&
      getWeekNumber(updatedAt) === currentWeek
    );
  });
}

function getWeekNumber(date: Date) {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  return Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
