import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { createGameForCurrentUser, listGamesForUser } from "../lib/appClient";
import type { GameRecord } from "../types";

export function GamesPage() {
  const navigate = useNavigate();
  const { profile, profiles, refreshProfiles, user } = useAppContext();
  const [games, setGames] = useState<GameRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setIsLoading(true);
        await refreshProfiles();
        const nextGames = await listGamesForUser();
        setGames(nextGames);
        setError(null);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Kunne ikke hente spill.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [profile?.id]);

  const currentUser = profiles.find((item) => item.id === profile?.id) ?? profile ?? profiles[0];
  const onlineGames = games.filter(
    (game) => game.whiteUserId === currentUser?.id || game.blackUserId === currentUser?.id,
  );

  const groupedOpponents = Object.values(
    onlineGames.reduce<Record<string, { name: string; active: number; finished: number }>>(
      (acc, game) => {
        const opponentName =
          game.whiteUserId === currentUser?.id ? game.blackName : game.whiteName;

        acc[opponentName] ??= { name: opponentName, active: 0, finished: 0 };
        if (game.status === "finished") {
          acc[opponentName].finished += 1;
        } else {
          acc[opponentName].active += 1;
        }

        return acc;
      },
      {},
    ),
  );

  async function startLocalGame() {
    const game = await createGameForCurrentUser(user, profiles, {
      mode: "local-pass-play",
    });
    setGames((current) => [game, ...current]);
    navigate(`/spill/${game.id}`);
  }

  async function startOnlineGame() {
    const opponent = profiles.find((item) => item.id !== currentUser?.id) ?? profiles[1];
    const game = await createGameForCurrentUser(user, profiles, {
      mode: "online",
      opponentId: opponent?.id,
    });
    setGames((current) => [game, ...current]);
    navigate(`/spill/${game.id}`);
  }

  return (
    <div className="stack-lg">
      <section className="card card-actions">
        <div>
          <h1>Mine spill</h1>
          <p>
            Oversikten under er delt i motspillere og konkrete partier. Den er allerede formet som
            visningen du beskrev, og henter nå data fra Supabase når backend er konfigurert.
          </p>
        </div>

        <div className="button-row">
          <button type="button" className="button button-primary" onClick={startLocalGame}>
            Nytt lokalt spill
          </button>
          <button type="button" className="button button-secondary" onClick={startOnlineGame}>
            Nytt online-spill
          </button>
        </div>
      </section>

      {error ? <section className="card"><p className="error-text">{error}</p></section> : null}
      {isLoading ? <section className="card"><p>Laster spill...</p></section> : null}

      <section className="grid-two">
        <article className="card">
          <h2>Brukere du spiller mot</h2>
          <div className="stack-md">
            {groupedOpponents.length === 0 ? (
              <p>Ingen online-partier ennå.</p>
            ) : (
              groupedOpponents.map((opponent) => (
                <div key={opponent.name} className="summary-row">
                  <strong>{opponent.name}</strong>
                  <span>{opponent.active} pågående</span>
                  <span>{opponent.finished} ferdige</span>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="card">
          <h2>Historiske og pågående spill</h2>
          <div className="stack-md">
            {games.map((game) => (
              <Link key={game.id} className="game-row" to={`/spill/${game.id}`}>
                <div>
                  <strong>
                    {game.whiteName} vs {game.blackName}
                  </strong>
                  <span>{game.mode === "online" ? "Hver sin enhet" : "Samme enhet"}</span>
                </div>
                <div className="game-meta">
                  <span className={`pill status-${game.status}`}>{game.status}</span>
                  <span>{new Date(game.updatedAt).toLocaleDateString("no-NO")}</span>
                </div>
              </Link>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
