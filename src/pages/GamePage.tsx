import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import type { Square } from "chess.js";
import { useAppContext } from "../context/AppContext";
import { ChessBoard } from "../components/ChessBoard";
import { EvaluationBar } from "../components/EvaluationBar";
import { TurnIndicator } from "../components/TurnIndicator";
import { attemptMove, getFriendlyGameMessage, getStatusText, getTurn } from "../lib/chess";
import { getGameById, saveMove, subscribeToGame } from "../lib/appClient";
import { getPostGameFeedback } from "../lib/gamification";
import type { PositionEvaluation } from "../lib/stockfish";
import { usePositionEvaluation } from "../lib/usePositionEvaluation";
import type { GameRecord } from "../types";

interface PendingMoveInsight {
  afterFen: string;
  movedBy: "w" | "b";
  beforeWhiteChance: number;
  san: string;
}

export function GamePage() {
  const { gameId } = useParams();
  const { profile } = useAppContext();
  const [game, setGame] = useState<GameRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingMoveInsight, setPendingMoveInsight] = useState<PendingMoveInsight | null>(null);
  const [lastMoveInsight, setLastMoveInsight] = useState<string | null>(null);
  const currentUserId = profile?.id ?? undefined;
  const { evaluation, isAnalyzing, error: evaluationError } = usePositionEvaluation(
    game?.currentFen ?? null,
    10,
  );

  function mergeWithCurrent(nextGame: GameRecord | null) {
    setGame((current) => {
      if (!nextGame) {
        return current;
      }

      if (!current) {
        return nextGame;
      }

      if (nextGame.moveHistory.length < current.moveHistory.length) {
        return current;
      }

      return nextGame;
    });
  }

  useEffect(() => {
    if (!gameId) {
      return;
    }

    let active = true;
    setIsLoading(true);

    void (async () => {
      try {
        const nextGame = await getGameById(gameId);
        if (!active) return;
        mergeWithCurrent(nextGame);
        setError(null);
      } catch (cause) {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Kunne ikke hente spillet.");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    })();

    const unsubscribe = subscribeToGame(gameId, () => {
      void (async () => {
        const fresh = await getGameById(gameId);
        mergeWithCurrent(fresh);
      })();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [gameId]);

  useEffect(() => {
    if (!evaluation || !pendingMoveInsight) {
      return;
    }

    if (evaluation.fen !== pendingMoveInsight.afterFen) {
      return;
    }

    const before = pendingMoveInsight.movedBy === "w"
      ? pendingMoveInsight.beforeWhiteChance
      : 1 - pendingMoveInsight.beforeWhiteChance;
    const after = pendingMoveInsight.movedBy === "w"
      ? evaluation.whiteChance
      : evaluation.blackChance;
    const beforePercent = Math.round(before * 100);
    const afterPercent = Math.round(after * 100);
    const delta = afterPercent - beforePercent;

    setLastMoveInsight(
      describeMoveImpact(pendingMoveInsight.san, pendingMoveInsight.movedBy, beforePercent, afterPercent, delta),
    );
    setPendingMoveInsight(null);
  }, [evaluation, pendingMoveInsight]);

  const orientation = useMemo(() => {
    if (!game) return "w" as const;
    if (game.blackUserId && game.blackUserId === currentUserId) return "b" as const;
    return "w" as const;
  }, [currentUserId, game]);

  const movableColor = useMemo(() => {
    if (!game) {
      return "both" as const;
    }

    if (game.mode !== "online") {
      return "both" as const;
    }

    if (game.whiteUserId === currentUserId) {
      return "w" as const;
    }

    if (game.blackUserId === currentUserId) {
      return "b" as const;
    }

    return null;
  }, [currentUserId, game]);

  if (isLoading) {
    return (
      <section className="card">
        <h1>Laster spill</h1>
        <p>Henter stilling og trekkhistorikk...</p>
      </section>
    );
  }

  if (!game) {
    return (
      <section className="card">
        <h1>Fant ikke spillet</h1>
        <p>{error ?? "Spillet finnes ikke ennå."}</p>
      </section>
    );
  }

  const currentGame = game;
  const postGameFeedback = getPostGameFeedback(game);

  function handleMove(from: Square, to: Square) {
    const result = attemptMove(currentGame.currentFen, from, to, currentUserId);

    if (!result.ok) {
      return false;
    }

    const nextGame: GameRecord = {
      ...currentGame,
      currentFen: result.fen,
      pgn: result.pgn,
      moveHistory: [...currentGame.moveHistory, result.move],
      updatedAt: new Date().toISOString(),
      lastMoveAt: new Date().toISOString(),
    };

    setPendingMoveInsight({
      afterFen: result.fen,
      movedBy: getTurn(currentGame.currentFen),
      beforeWhiteChance: evaluation?.whiteChance ?? 0.5,
      san: result.move.san,
    });

    setGame(nextGame);
    void (async () => {
      try {
        const persisted = await saveMove({
          game: currentGame,
          move: result.move,
          fen: result.fen,
          pgn: result.pgn,
        });
        mergeWithCurrent(persisted);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Kunne ikke lagre trekk.");
      }
    })();
    return true;
  }

  return (
    <div className="game-layout">
      <section className="card board-card">
        {error ? <p className="error-text">{error}</p> : null}
        <div className={`encouragement-banner tone-${postGameFeedback.tone}`}>
          <strong>{postGameFeedback.title}</strong>
          <span>{postGameFeedback.body}</span>
        </div>
        <div className="game-header">
          <div>
            <h1>
              {game.whiteName} vs {game.blackName}
            </h1>
            <p>{game.mode === "online" ? "Spill på hver sin enhet" : "Spill på samme enhet"}</p>
          </div>

          <div className="game-status">
            <TurnIndicator
              turn={getTurn(game.currentFen)}
              whiteLabel={game.whiteName}
              blackLabel={game.blackName}
              statusText={getStatusText(game.currentFen)}
            />
          </div>
        </div>

        <ChessBoard
          fen={game.currentFen}
          orientation={orientation}
          movableColor={movableColor ?? "both"}
          interactive={game.mode === "local-pass-play" || Boolean(movableColor)}
          onMove={handleMove}
        />

        <p className="help-text">
          Trykk på en brikke for å velge den, eller hold inne et kort øyeblikk for å fremheve
          lovlige trekk og dra brikken til ønsket felt.
        </p>
        {game.mode === "online" && movableColor ? (
          <p className="support-text">
            Du spiller som {movableColor === "w" ? "hvit" : "sort"} i dette partiet.
          </p>
        ) : null}
        {game.mode === "online" && !movableColor ? (
          <p className="support-text">
            Dette online-partiet kan bare spilles av de to registrerte spillerne.
          </p>
        ) : null}
        <p className="support-text">
          {getFriendlyGameMessage(game.currentFen, game.moveHistory.length)}
        </p>
      </section>

      <aside className="stack-md">
        <section className="card">
          <h2>Styrkeforhold</h2>
          <EvaluationBar
            evaluation={evaluation}
            whiteLabel={game.whiteName}
            blackLabel={game.blackName}
            isAnalyzing={isAnalyzing}
          />
          {evaluationError ? <p className="error-text">{evaluationError}</p> : null}
          {lastMoveInsight ? <p className="support-text">{lastMoveInsight}</p> : null}
        </section>

        <section className="card">
          <h2>Partiinformasjon</h2>
          <div className="stack-sm">
            <div className="summary-row">
              <strong>Modus</strong>
              <span>{game.mode === "online" ? "Hver sin enhet" : "Samme enhet"}</span>
            </div>
            <div className="summary-row">
              <strong>Status</strong>
              <span>{game.status}</span>
            </div>
            <div className="summary-row">
              <strong>Siste aktivitet</strong>
              <span>{new Date(game.updatedAt).toLocaleString("no-NO")}</span>
            </div>
          </div>
        </section>

        <section className="card">
          <h2>Trekkhistorikk</h2>
          <ol className="move-list">
            {game.moveHistory.length === 0 ? (
              <li>Ingen trekk ennå.</li>
            ) : (
              game.moveHistory.map((move) => (
              <li key={move.id}>
                  <strong>{move.san}</strong>
                  <span>
                    {move.from} → {move.to}
                  </span>
                </li>
              ))
            )}
          </ol>
        </section>
      </aside>
    </div>
  );
}

function describeMoveImpact(
  san: string,
  movedBy: "w" | "b",
  beforePercent: number,
  afterPercent: number,
  delta: number,
) {
  const side = movedBy === "w" ? "Hvit" : "Sort";

  if (delta >= 8) {
    return `${side} sitt trekk ${san} løftet balansen fra ${beforePercent}% til ${afterPercent}%. Dette ser ut som et sterkt trekk.`;
  }

  if (delta >= 3) {
    return `${side} sitt trekk ${san} forbedret stillingen fra ${beforePercent}% til ${afterPercent}%.`;
  }

  if (delta <= -8) {
    return `${side} sitt trekk ${san} senket balansen fra ${beforePercent}% til ${afterPercent}%. Kanskje dette er verdt å se nærmere på.`;
  }

  if (delta <= -3) {
    return `${side} sitt trekk ${san} ga bort litt balanse: ${beforePercent}% til ${afterPercent}%.`;
  }

  return `${side} sitt trekk ${san} holdt stillingen ganske stabil: ${beforePercent}% til ${afterPercent}%.`;
}
