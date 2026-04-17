import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { createGameForCurrentUser, listGamesForUser } from "../lib/appClient";
import { ProfileAvatar } from "../components/ProfileAvatar";
import type { GameRecord, Profile } from "../types";

export function GamesPage() {
  const navigate = useNavigate();
  const { profile, profiles, refreshProfiles } = useAppContext();
  const [games, setGames] = useState<GameRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isStartingOnline, setIsStartingOnline] = useState<string | null>(null);

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

  const opponentSummaries = useMemo(() => {
    return profiles
      .filter((item) => item.id !== currentUser?.id)
      .map((opponent) => summarizeOpponent(opponent, onlineGames, currentUser?.id))
      .sort((left, right) => {
        const relevance = getSearchRelevance(right.profile, searchQuery) - getSearchRelevance(left.profile, searchQuery);
        if (searchQuery.trim() && relevance !== 0) {
          return relevance;
        }

        const rightTimestamp = getTimestamp(right.latestPlayedAt);
        const leftTimestamp = getTimestamp(left.latestPlayedAt);
        if (rightTimestamp !== leftTimestamp) {
          return rightTimestamp - leftTimestamp;
        }

        return left.profile.displayName.localeCompare(right.profile.displayName, "no");
      })
      .filter((item) => {
        if (!searchQuery.trim()) {
          return true;
        }

        return getSearchRelevance(item.profile, searchQuery) > 0;
      });
  }, [currentUser?.id, onlineGames, profiles, searchQuery]);

  async function startLocalGame() {
    const game = await createGameForCurrentUser(profile, profiles, {
      mode: "local-pass-play",
    });
    setGames((current) => [game, ...current]);
    navigate(`/spill/${game.id}`);
  }

  async function openOnlineGame(opponent: Profile) {
    if (!profile) {
      navigate("/logg-inn");
      return;
    }

    const existingActiveGame = onlineGames.find((game) => {
      const players = [game.whiteUserId, game.blackUserId];
      return (
        game.status !== "finished" &&
        players.includes(profile.id) &&
        players.includes(opponent.id)
      );
    });

    if (existingActiveGame) {
      navigate(`/spill/${existingActiveGame.id}`);
      return;
    }

    try {
      setIsStartingOnline(opponent.id);
      const game = await createGameForCurrentUser(profile, profiles, {
        mode: "online",
        opponentId: opponent.id,
      });
      setGames((current) => [game, ...current.filter((item) => item.id !== game.id)]);
      navigate(`/spill/${game.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Kunne ikke starte online-spill.");
    } finally {
      setIsStartingOnline(null);
    }
  }

  return (
    <div className="stack-lg">
      <section className="card card-actions">
        <div>
          <h1>Mine spill</h1>
          <p>
            Oversikten under er delt i motspillere og konkrete partier. Den er allerede formet som
            visningen du beskrev, og henter nå data fra skyen når du er logget inn.
          </p>
        </div>

        <div className="button-row">
          <button type="button" className="button button-primary" onClick={startLocalGame}>
            Nytt lokalt spill
          </button>
          <a className="button button-secondary" href="#spillere">
            Velg motspiller online
          </a>
        </div>
      </section>

      {error ? <section className="card"><p className="error-text">{error}</p></section> : null}
      {isLoading ? <section className="card"><p>Laster spill...</p></section> : null}

      <section className="grid-two">
        <article className="card" id="spillere">
          <div className="stack-sm">
            <h2>Velg motspiller</h2>
            <p>
              Velg en registrert bruker for å fortsette et pågående parti eller starte et nytt.
              Hvis dere allerede har et uferdig parti, åpnes det automatisk.
            </p>
          </div>
          <label className="field field-search">
            <span>Søk etter bruker</span>
            <input
              type="search"
              placeholder="Søk på navn eller brukernavn"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>
          <div className="stack-md">
            {opponentSummaries.length === 0 ? (
              <p>Ingen brukere matcher søket ennå.</p>
            ) : (
              opponentSummaries.map((opponent) => (
                <button
                  key={opponent.profile.id}
                  type="button"
                  className="opponent-row"
                  onClick={() => void openOnlineGame(opponent.profile)}
                  disabled={isStartingOnline === opponent.profile.id}
                >
                  <div className="opponent-row-main">
                    <ProfileAvatar profile={opponent.profile} />
                    <div className="opponent-row-copy">
                      <strong>{opponent.profile.displayName}</strong>
                      <span>@{opponent.profile.username}</span>
                    </div>
                  </div>
                  <div className="opponent-row-meta">
                    <span className={`pill ${opponent.activeGame ? "status-active" : "ghost-pill"}`}>
                      {opponent.activeGame ? "Fortsett pågående" : "Start nytt spill"}
                    </span>
                    <span>
                      {opponent.latestPlayedAt
                        ? `Sist spilt ${new Date(opponent.latestPlayedAt).toLocaleDateString("no-NO")}`
                        : "Ingen partier ennå"}
                    </span>
                    <span>{opponent.activeCount} pågående · {opponent.finishedCount} ferdige</span>
                  </div>
                </button>
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

function summarizeOpponent(opponent: Profile, games: GameRecord[], currentUserId?: string) {
  const relatedGames = games.filter((game) => {
    const players = [game.whiteUserId, game.blackUserId];
    return players.includes(currentUserId) && players.includes(opponent.id);
  });

  const activeGame = relatedGames.find((game) => game.status !== "finished") ?? null;
  const latestPlayedAt = relatedGames
    .map((game) => game.updatedAt)
    .sort((left, right) => getTimestamp(right) - getTimestamp(left))[0];

  return {
    profile: opponent,
    activeGame,
    activeCount: relatedGames.filter((game) => game.status !== "finished").length,
    finishedCount: relatedGames.filter((game) => game.status === "finished").length,
    latestPlayedAt,
  };
}

function getSearchRelevance(profile: Profile, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return 1;
  }

  const displayName = profile.displayName.toLowerCase();
  const username = profile.username.toLowerCase();

  if (displayName === normalizedQuery || username === normalizedQuery) {
    return 100;
  }

  if (displayName.startsWith(normalizedQuery)) {
    return 75;
  }

  if (username.startsWith(normalizedQuery)) {
    return 70;
  }

  if (displayName.includes(normalizedQuery)) {
    return 50;
  }

  if (username.includes(normalizedQuery)) {
    return 45;
  }

  return 0;
}

function getTimestamp(value?: string) {
  return value ? new Date(value).getTime() : 0;
}
