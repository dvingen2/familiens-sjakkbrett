import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { usePwaContext } from "../context/PwaContext";
import type { Square } from "chess.js";
import { ChessBoard } from "../components/ChessBoard";
import { EvaluationBar } from "../components/EvaluationBar";
import { TurnIndicator } from "../components/TurnIndicator";
import { attemptMove, getFriendlyGameMessage, getStatusText, getTurn } from "../lib/chess";
import { getDailyLessonChallenge } from "../lib/lessons";
import { getGames, getOrCreateQuickLocalGame, resetQuickLocalGame, updateGame } from "../lib/storage";
import { getGamificationSnapshot, getPostGameFeedback } from "../lib/gamification";
import { usePositionEvaluation } from "../lib/usePositionEvaluation";
import type { GameRecord } from "../types";

export function HomePage() {
  const { isSupabaseMode, profile, profiles } = useAppContext();
  const { canInstall, installApp, isInstalled, isOnline } = usePwaContext();
  const [quickGame, setQuickGame] = useState<GameRecord | null>(null);
  const [refreshSeed, setRefreshSeed] = useState(0);
  const [installMessage, setInstallMessage] = useState<string | null>(null);
  const [lastMoveInsight, setLastMoveInsight] = useState<string | null>(null);
  const [pendingMoveInsight, setPendingMoveInsight] = useState<{
    afterFen: string;
    movedBy: "w" | "b";
    beforeWhiteChance: number;
    san: string;
  } | null>(null);
  const { evaluation, isAnalyzing, error: evaluationError } = usePositionEvaluation(
    quickGame?.currentFen ?? null,
    9,
  );

  useEffect(() => {
    setQuickGame(getOrCreateQuickLocalGame());
  }, []);

  const allGames = getGames();
  const snapshot = getGamificationSnapshot(allGames, profile);
  const dailyLesson = getDailyLessonChallenge();
  const quickFeedback = quickGame ? getPostGameFeedback(quickGame) : null;
  const latestQuickMove = quickGame?.moveHistory[quickGame.moveHistory.length - 1] ?? null;

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

  function handleMove(from: Square, to: Square) {
    if (!quickGame) {
      return false;
    }

    const result = attemptMove(quickGame.currentFen, from, to, profile?.id);
    if (!result.ok) {
      return false;
    }

    const nextGame: GameRecord = {
      ...quickGame,
      currentFen: result.fen,
      pgn: result.pgn,
      moveHistory: [...quickGame.moveHistory, result.move],
      updatedAt: new Date().toISOString(),
      lastMoveAt: new Date().toISOString(),
    };

    setPendingMoveInsight({
      afterFen: result.fen,
      movedBy: getTurn(quickGame.currentFen),
      beforeWhiteChance: evaluation?.whiteChance ?? 0.5,
      san: result.move.san,
    });

    setQuickGame(nextGame);
    updateGame(nextGame);
    setRefreshSeed((value) => value + 1);
    return true;
  }

  return (
    <div className="stack-lg">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Mobilvennlig familiesjakk</p>
          <h1>Åpne siden og start et nytt lokalt spill med én gang.</h1>
          <p className="lead">
            {profile
              ? "Du er logget inn, så familien kan både spille lokalt med én gang og fortsette med sky-lagrede spill når dere vil."
              : "Dette lokale spillet starter uten innlogging og lagres bare i nettleseren på denne enheten. Innlogging og online-spill er valgfritt og kan tas i bruk senere."}
          </p>

          <div className="hero-actions">
            <button
              type="button"
              className="button button-primary"
              onClick={() => setQuickGame(resetQuickLocalGame())}
            >
              Start nytt lokalt spill
            </button>
            <Link className="button button-secondary" to="/mine-spill">
              Se flere spill
            </Link>
            <Link className="button button-secondary" to="/laer">
              Start læringsløpet
            </Link>
            {profile && profiles.some((item) => item.id !== profile.id) ? (
              <Link className="button button-secondary" to="/mine-spill#spillere">
                Start online-spill
              </Link>
            ) : null}
            {!profile ? (
              <Link className="button button-secondary" to="/logg-inn">
                Familieprofil og sky
              </Link>
            ) : null}
          </div>
        </div>

        <aside className="info-card">
          <h2>Status nå</h2>
          <ul className="plain-list">
            <li>Responsivt touch-brett</li>
            <li>Trykk for å velge, hold inne for markering og dra</li>
            <li>
              {profile ? `Aktiv bruker: @${profile.username}` : "Ingen aktiv bruker ennå"}
            </li>
            <li>Klar for GitHub Pages med `HashRouter`</li>
            <li>{isSupabaseMode ? "Supabase er konfigurert" : "Lokal demo-modus er aktiv"}</li>
            <li>{isInstalled ? "Appen er lagret på hjemskjerm" : "Kan brukes som hjemskjerm-app"}</li>
          </ul>
        </aside>
      </section>

      <section className="grid-two">
        <article className="card">
          <h2>Hjemskjerm-app</h2>
          <p>
            Lagre appen på telefonen for å gjøre den lettere å åpne for barna, og for å få en mer
            app-lignende opplevelse når familien spiller sammen.
          </p>
          <div className="quickplay-actions">
            {canInstall ? (
              <button
                type="button"
                className="button button-primary"
                onClick={() => {
                  void installApp().then((accepted) => {
                    setInstallMessage(
                      accepted
                        ? "Appen ble sendt til installasjon. Se etter den på hjemskjermen."
                        : "Installasjonen ble avbrutt denne gangen.",
                    );
                  });
                }}
              >
                Legg til på hjemskjerm
              </button>
            ) : (
              <span className="pill">{isInstalled ? "Allerede installert" : "Install-knappen vises når nettleseren er klar"}</span>
            )}
            <span className="pill ghost-pill">{isOnline ? "Nå online" : "Nå offline"}</span>
          </div>
          {installMessage ? <p className="info-text">{installMessage}</p> : null}
        </article>

        <article className="card">
          <h2>Offline-flyt</h2>
          <p>
            Hvis nettet forsvinner, skal appen fortsatt kunne åpnes og lokale partier skal kunne
            fortsette på samme enhet. {profile ? "Innloggingen din beholdes, og sky-synk kan vente til nettet er tilbake." : "Skyfunksjoner kan vente til nettet er tilbake."}
          </p>
        </article>
      </section>

      {quickGame ? (
        <section className="card board-card quickplay-card">
          <div className={`encouragement-banner tone-${quickFeedback?.tone ?? "warm"}`}>
            <strong>Spill sammen nå</strong>
            <span>{getFriendlyGameMessage(quickGame.currentFen, quickGame.moveHistory.length)}</span>
          </div>
          <div className="game-header">
            <div>
              <h2>Nytt lokalt spill</h2>
              <p>
                {profile
                  ? "Pass-and-play på samme enhet. Perfekt for en rask familierunde selv når du allerede er logget inn."
                  : "Pass-and-play på samme enhet, uten innlogging. Perfekt for en rask familierunde."}
              </p>
            </div>

            <div className="game-status">
              <TurnIndicator
                turn={getTurn(quickGame.currentFen)}
                whiteLabel="på denne enheten"
                blackLabel="på denne enheten"
                statusText={getStatusText(quickGame.currentFen)}
              />
            </div>
          </div>

          <ChessBoard
            fen={quickGame.currentFen}
            lastMove={latestQuickMove}
            onMove={handleMove}
          />
          <div className="quickplay-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setQuickGame(resetQuickLocalGame())}
            >
              Start helt på nytt
            </button>
            {profile ? (
              <Link className="button button-secondary" to="/mine-spill">
                Åpne Mine spill
              </Link>
            ) : (
              <Link className="button button-secondary" to="/logg-inn">
                Logg inn og lagre i skyen
              </Link>
            )}
          </div>
          <p className="help-text">
            Trykk på en brikke for å velge den, eller hold inne et kort øyeblikk for å fremheve
            lovlige trekk og dra brikken til ønsket felt.
          </p>
          {latestQuickMove ? (
            <p className="support-text last-move-text">
              Siste trekk: <strong>{latestQuickMove.san}</strong>
              {" · "}
              {latestQuickMove.from} → {latestQuickMove.to}
            </p>
          ) : null}
          <div className="board-analysis-block">
            <EvaluationBar
              evaluation={evaluation}
              whiteLabel="på denne enheten"
              blackLabel="på denne enheten"
              isAnalyzing={isAnalyzing}
            />
            {evaluationError ? <p className="error-text">{evaluationError}</p> : null}
            {lastMoveInsight ? <p className="support-text">{lastMoveInsight}</p> : null}
          </div>
        </section>
      ) : null}

      <section className="grid-two">
        <article className="card">
          <h2>Dagens oppgave</h2>
          {dailyLesson ? (
            <>
              <p>
                <strong>{dailyLesson.title}</strong> · {dailyLesson.duration}
              </p>
              <p>{dailyLesson.summary}</p>
              <div className="quickplay-actions">
                <Link className="button button-primary" to={`/laer?lesson=${dailyLesson.id}`}>
                  Åpne dagens leksjon
                </Link>
                <span className="pill ghost-pill">{dailyLesson.rewardEmoji} {dailyLesson.rewardTitle}</span>
              </div>
            </>
          ) : null}
        </article>

        <article className="card">
          <h2>Ny læringsdel</h2>
          <p>
            Korte leksjoner er nå på plass som første versjon. De bygger trygghet rundt brikker,
            sjakk matt, rokade, hengende brikker og små taktiske ideer.
          </p>
          <div className="quickplay-actions">
            <Link className="button button-primary" to="/laer">
              Gå til Lær
            </Link>
            <span className="pill ghost-pill">10 startleksjoner klare</span>
          </div>
        </article>

        <article className="card">
          <h2>Ukas familieutfordring</h2>
          <p>{snapshot.weeklyChallenge.description}</p>
          <div className="challenge-progress">
            <div
              className="challenge-progress-bar"
              style={{
                width: `${(snapshot.weeklyChallenge.progress / snapshot.weeklyChallenge.goal) * 100}%`,
              }}
            />
          </div>
          <p className="challenge-meta">
            {snapshot.weeklyChallenge.completed
              ? "Utfordringen er i mål. Sterkt jobbet."
              : `${snapshot.weeklyChallenge.progress} av ${snapshot.weeklyChallenge.goal} fullført`}
          </p>
        </article>

        <article className="card">
          <h2>Familietrofeer</h2>
          <div className="badge-grid">
            {snapshot.earnedBadges.length === 0 ? (
              <div className="badge-card badge-card-soft">
                <strong>Første trofé venter</strong>
                <span>Spill noen trekk sammen, så begynner samlingen å fylles.</span>
              </div>
            ) : (
              snapshot.earnedBadges.map((badge) => (
                <div key={badge.id} className="badge-card">
                  <strong>{badge.title}</strong>
                  <span>{badge.description}</span>
                </div>
              ))
            )}
          </div>
          {snapshot.nextBadges.length > 0 ? (
            <div className="next-badges">
              <strong>Neste milepæler</strong>
              <div className="pill-row">
                {snapshot.nextBadges.map((badge) => (
                  <span key={badge.id} className="pill ghost-pill">
                    {badge.title}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </article>
      </section>
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
    return `${side} sitt trekk ${san} løftet balansen fra ${beforePercent}% til ${afterPercent}%. Dette ser sterkt ut.`;
  }

  if (delta >= 3) {
    return `${side} sitt trekk ${san} forbedret balansen fra ${beforePercent}% til ${afterPercent}%.`;
  }

  if (delta <= -8) {
    return `${side} sitt trekk ${san} senket balansen fra ${beforePercent}% til ${afterPercent}%. Dette kan være verdt å analysere nærmere.`;
  }

  if (delta <= -3) {
    return `${side} sitt trekk ${san} ga bort litt balanse: ${beforePercent}% til ${afterPercent}%.`;
  }

  return `${side} sitt trekk ${san} holdt stillingen ganske stabil: ${beforePercent}% til ${afterPercent}%.`;
}
