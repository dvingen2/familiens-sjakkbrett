import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import type { Square } from "chess.js";
import { useAppContext } from "../context/AppContext";
import { ChessBoard } from "../components/ChessBoard";
import { attemptMove, getStatusText, getTurn } from "../lib/chess";
import { getGameById, saveMove, subscribeToGame } from "../lib/appClient";
import type { GameRecord } from "../types";

export function GamePage() {
  const { gameId } = useParams();
  const { profile } = useAppContext();
  const [game, setGame] = useState<GameRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentUserId = profile?.id ?? undefined;

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
        setGame(nextGame);
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
        setGame(fresh);
      })();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [gameId]);

  const orientation = useMemo(() => {
    if (!game) return "w" as const;
    if (game.blackUserId && game.blackUserId === currentUserId) return "b" as const;
    return "w" as const;
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

    setGame(nextGame);
    void (async () => {
      try {
        const persisted = await saveMove({
          game: currentGame,
          move: result.move,
          fen: result.fen,
          pgn: result.pgn,
        });
        setGame(persisted);
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
        <div className="game-header">
          <div>
            <h1>
              {game.whiteName} vs {game.blackName}
            </h1>
            <p>{game.mode === "online" ? "Spill på hver sin enhet" : "Spill på samme enhet"}</p>
          </div>

          <div className="game-status">
            <span className="pill">{getTurn(game.currentFen) === "w" ? "Hvit i trekk" : "Sort i trekk"}</span>
            <span>{getStatusText(game.currentFen)}</span>
          </div>
        </div>

        <ChessBoard fen={game.currentFen} orientation={orientation} onMove={handleMove} />

        <p className="help-text">
          Trykk på en brikke for å velge den, eller hold inne et kort øyeblikk for å fremheve
          lovlige trekk og dra brikken til ønsket felt.
        </p>
      </section>

      <aside className="stack-md">
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
