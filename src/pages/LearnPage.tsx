import { useEffect, useMemo, useState } from "react";
import type { Square } from "chess.js";
import { Link, useSearchParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { ChessBoard } from "../components/ChessBoard";
import {
  getAllLessons,
  getDailyLessonChallenge,
  getLearningRewards,
  getLessonById,
  LESSON_MODULES,
} from "../lib/lessons";
import { getCompletedLessonIds, markLessonCompleted, resetLessonProgress } from "../lib/storage";

export function LearnPage() {
  const { profile } = useAppContext();
  const viewerId = profile?.id ?? null;
  const [searchParams, setSearchParams] = useSearchParams();
  const lessonParam = searchParams.get("lesson");
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [taskFeedback, setTaskFeedback] = useState<string | null>(null);
  const [taskWasCorrect, setTaskWasCorrect] = useState<boolean | null>(null);
  const [hintVisible, setHintVisible] = useState(false);
  const [recentReward, setRecentReward] = useState<{
    lessonTitle: string;
    rewardEmoji: string;
    rewardTitle: string;
  } | null>(null);

  useEffect(() => {
    const completed = getCompletedLessonIds(viewerId);
    setCompletedLessonIds(completed);

    const fromUrl = lessonParam ? getLessonById(lessonParam) : null;
    const firstIncomplete = getAllLessons().find((lesson) => !completed.includes(lesson.id));
    setSelectedLessonId(fromUrl?.lesson.id ?? firstIncomplete?.id ?? getAllLessons()[0]?.id ?? null);
  }, [lessonParam, viewerId]);

  const selected = useMemo(
    () => (selectedLessonId ? getLessonById(selectedLessonId) : null),
    [selectedLessonId],
  );

  const completedSet = useMemo(() => new Set(completedLessonIds), [completedLessonIds]);
  const totalLessonCount = getAllLessons().length;
  const completedCount = completedLessonIds.length;
  const progressPercent = totalLessonCount > 0 ? (completedCount / totalLessonCount) * 100 : 0;
  const learningRewards = useMemo(
    () => getLearningRewards(completedLessonIds),
    [completedLessonIds],
  );
  const dailyLesson = useMemo(() => getDailyLessonChallenge(), []);
  const isDailyLessonCompleted = dailyLesson ? completedSet.has(dailyLesson.id) : false;

  useEffect(() => {
    setTaskFeedback(null);
    setTaskWasCorrect(null);
    setHintVisible(false);
  }, [selectedLessonId]);

  function completeLesson(lessonId: string, autoAdvance = false) {
    const lessonEntry = getLessonById(lessonId);
    markLessonCompleted(lessonId, viewerId);
    const nextCompleted = Array.from(new Set([...completedLessonIds, lessonId]));
    setCompletedLessonIds(nextCompleted);
    if (lessonEntry) {
      setRecentReward({
        lessonTitle: lessonEntry.lesson.title,
        rewardEmoji: lessonEntry.lesson.rewardEmoji,
        rewardTitle: lessonEntry.lesson.rewardTitle,
      });
    }

    if (autoAdvance) {
      const nextLesson = getAllLessons().find((lesson) => !nextCompleted.includes(lesson.id));
      setSelectedLessonId(nextLesson?.id ?? lessonId);
      if (nextLesson) {
        setSearchParams({ lesson: nextLesson.id });
      }
    }
  }

  function handleTaskSquareSelect(square: Square) {
    if (!selected?.lesson.task) {
      return;
    }

    const isCorrect = selected.lesson.task.validSquares.includes(square);
    setTaskWasCorrect(isCorrect);
    setTaskFeedback(
      isCorrect ? selected.lesson.task.successMessage : selected.lesson.task.failureMessage,
    );

    if (isCorrect && !completedSet.has(selected.lesson.id)) {
      completeLesson(selected.lesson.id);
    }
  }

  return (
    <div className="stack-lg">
      <section className="hero learn-hero">
        <div className="hero-copy">
          <p className="eyebrow">Lær sjakk steg for steg</p>
          <h1>Små leksjoner som gjør familien tryggere og modigere ved brettet.</h1>
          <p className="lead">
            Dette er første versjon av leksjonsmodus: korte, modulære leksjoner med belønninger,
            tydelig progresjon og små oppdrag dere kan ta med videre inn i ekte partier.
          </p>
          <div className="hero-actions">
            {selectedLessonId ? (
              <button
                type="button"
                className="button button-primary"
                onClick={() => {
                  completeLesson(selectedLessonId, true);
                }}
              >
                Fullfør valgt leksjon
              </button>
            ) : null}
            <button
              type="button"
              className="button button-secondary"
              onClick={() => {
                resetLessonProgress(viewerId);
                setCompletedLessonIds([]);
                setSelectedLessonId(getAllLessons()[0]?.id ?? null);
              }}
            >
              Start læringsløpet på nytt
            </button>
            <Link className="button button-secondary" to="/">
              Tilbake til spill
            </Link>
          </div>
        </div>

        <aside className="info-card">
          <h2>Læringsstatus</h2>
          <div className="challenge-progress lesson-progress-bar">
            <div className="challenge-progress-bar" style={{ width: `${progressPercent}%` }} />
          </div>
          <ul className="plain-list">
            <li>{completedCount} av {totalLessonCount} leksjoner fullført</li>
            <li>{LESSON_MODULES.length} moduler klare i første versjon</li>
            <li>{profile ? `Progresjon lagres for @${profile.username}` : "Progresjon lagres lokalt på denne enheten"}</li>
            <li>Neste fokus: korte økter, varme belønninger og ekte partioverføring</li>
          </ul>
        </aside>
      </section>

      <section className="grid-two learn-summary-grid">
        <article className="card module-card">
          <p className="eyebrow">dagens oppgave</p>
          <h2>Dagens leksjon</h2>
          {dailyLesson ? (
            <>
              <p>
                <strong>{dailyLesson.title}</strong> · {dailyLesson.duration}
              </p>
              <p className="support-text">{dailyLesson.summary}</p>
              <div className="quickplay-actions">
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => {
                    setSelectedLessonId(dailyLesson.id);
                    setSearchParams({ lesson: dailyLesson.id });
                  }}
                >
                  Åpne dagens leksjon
                </button>
                <span className="pill">{isDailyLessonCompleted ? "Fullført i dag" : "Klar nå"}</span>
              </div>
            </>
          ) : null}
        </article>

        <article className="card module-card">
          <p className="eyebrow">troféskap</p>
          <h2>Læringsbelønninger</h2>
          <div className="stack-sm">
            {learningRewards.earnedRewards.length > 0 ? (
              learningRewards.earnedRewards.map((reward) => (
                <div key={reward.id} className="learning-reward-row">
                  <span className="lesson-chip">{reward.emoji}</span>
                  <div>
                    <strong>{reward.title}</strong>
                    <div className="support-text">{reward.description}</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="support-text">Fullfør første leksjon for å åpne ditt første læringstrofé.</p>
            )}
          </div>
          {learningRewards.nextRewards.length > 0 ? (
            <>
              <p className="support-text"><strong>Neste milepæler</strong></p>
              <ul className="plain-list">
                {learningRewards.nextRewards.map((reward) => (
                  <li key={reward.id}>{reward.emoji} {reward.title}</li>
                ))}
              </ul>
            </>
          ) : null}
        </article>

        {LESSON_MODULES.map((module) => {
          const moduleCompleted = module.lessons.filter((lesson) => completedSet.has(lesson.id)).length;
          const modulePercent = (moduleCompleted / module.lessons.length) * 100;

          return (
            <article key={module.id} className="card module-card">
              <p className="eyebrow">{module.theme}</p>
              <h2>{module.title}</h2>
              <p>{module.subtitle}</p>
              <p className="support-text">{module.moduleGoal}</p>
              <div className="challenge-progress">
                <div className="challenge-progress-bar" style={{ width: `${modulePercent}%` }} />
              </div>
              <p className="challenge-meta">
                {moduleCompleted} av {module.lessons.length} leksjoner fullført
              </p>
              <p className="support-text">Belønningsspor: <strong>{module.rewardTrack}</strong></p>
            </article>
          );
        })}
      </section>

      <section className="learn-layout">
        <aside className="card lessons-sidebar">
          <h2>Alle leksjoner</h2>
          <div className="stack-md">
            {LESSON_MODULES.map((module) => (
              <section key={module.id} className="stack-sm">
                <div className="lesson-module-heading">
                  <strong>{module.order}. {module.title}</strong>
                  <small>{module.subtitle}</small>
                </div>
                <div className="stack-sm">
                  {module.lessons.map((lesson) => {
                    const isCompleted = completedSet.has(lesson.id);
                    const isSelected = lesson.id === selectedLessonId;

                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        className={`lesson-row ${isSelected ? "is-selected" : ""} ${isCompleted ? "is-completed" : ""}`}
                        onClick={() => {
                          setSelectedLessonId(lesson.id);
                          setSearchParams({ lesson: lesson.id });
                        }}
                      >
                        <span className="lesson-row-main">
                          <span className="lesson-row-meta">
                            <span className="lesson-chip">{lesson.rewardEmoji}</span>
                            <span>{lesson.title}</span>
                          </span>
                          <small>{lesson.duration}</small>
                        </span>
                        <span className="lesson-row-support">
                          {isCompleted ? "Fullført" : lesson.rewardTitle}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </aside>

        <section className="stack-md">
          {selected ? (
            <>
              <article className="card lesson-detail-card">
                <div className="lesson-detail-header">
                  <div>
                    <p className="eyebrow">
                      Modul {selected.module.order} · {selected.module.title}
                    </p>
                    <h1>{selected.lesson.title}</h1>
                    <p className="lead lesson-lead">{selected.lesson.summary}</p>
                  </div>
                  <div className="lesson-reward-badge">
                    <span>{selected.lesson.rewardEmoji}</span>
                    <strong>{selected.lesson.rewardTitle}</strong>
                  </div>
                </div>

                <div className="lesson-detail-grid">
                  <section className="lesson-panel">
                    <h2>Mål</h2>
                    <p>{selected.lesson.goal}</p>
                  </section>
                  <section className="lesson-panel">
                    <h2>Minioppdrag</h2>
                    <p>{selected.lesson.miniMission}</p>
                  </section>
                  <section className="lesson-panel">
                    <h2>Hvordan vi lærer dette</h2>
                    <ul className="plain-list">
                      {selected.lesson.teachingTools.map((tool) => (
                        <li key={tool}>{tool}</li>
                      ))}
                    </ul>
                  </section>
                  <section className="lesson-panel">
                    <h2>Hva barnet sitter igjen med</h2>
                    <ul className="plain-list">
                      {selected.lesson.output.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>
                </div>
              </article>

              {selected.lesson.task ? (
                <article className="card lesson-detail-card">
                  <h2>Prøv på brettet</h2>
                  <p>{selected.lesson.task.prompt}</p>
                  <ChessBoard
                    fen={selected.lesson.task.fen}
                    orientation={selected.lesson.task.orientation ?? "w"}
                    interactive={false}
                    highlightSquares={
                      hintVisible
                        ? selected.lesson.task.validSquares
                        : selected.lesson.task.highlightSquares
                    }
                    onSquareSelect={handleTaskSquareSelect}
                  />
                  <div className="quickplay-actions">
                    {!hintVisible ? (
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={() => setHintVisible(true)}
                      >
                        Vis hint
                      </button>
                    ) : (
                      <span className="pill ghost-pill">Hintet viser mulige svar</span>
                    )}
                  </div>
                  {taskFeedback ? (
                    <p className={taskWasCorrect ? "info-text" : "error-text"}>{taskFeedback}</p>
                  ) : (
                    <p className="support-text">
                      Trykk på en rute på brettet. Riktig svar låser opp leksjonen som fullført.
                    </p>
                  )}
                </article>
              ) : null}

              <article className="card lesson-detail-card">
                <h2>Motivasjon og belønning</h2>
                <ul className="plain-list">
                  {selected.lesson.motivation.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <div className="lesson-mission-callout">
                  <strong>Ta det med inn i ekte spill</strong>
                  <p>{selected.lesson.gameMission}</p>
                </div>
                {!completedSet.has(selected.lesson.id) ? (
                  <button
                    type="button"
                    className="button button-primary"
                    onClick={() => {
                      completeLesson(selected.lesson.id);
                    }}
                  >
                    Marker som fullført
                  </button>
                ) : (
                  <p className="challenge-meta">
                    Fullført. Denne leksjonen ligger nå i troféskapet ditt som et lite mestringssteg.
                  </p>
                )}
              </article>

              {recentReward && recentReward.lessonTitle === selected.lesson.title ? (
                <article className="card lesson-complete-card">
                  <p className="eyebrow">leksjon fullført</p>
                  <div className="lesson-complete-hero">
                    <span>{recentReward.rewardEmoji}</span>
                    <div>
                      <h2>{recentReward.rewardTitle}</h2>
                      <p>
                        {selected.lesson.title} er nå fullført og lagt i troféskapet ditt som et nytt
                        mestringssteg.
                      </p>
                    </div>
                  </div>
                  <div className="quickplay-actions">
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={() => {
                        completeLesson(selected.lesson.id, true);
                        setRecentReward(null);
                      }}
                    >
                      Gå til neste leksjon
                    </button>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => setRecentReward(null)}
                    >
                      Fortsett her
                    </button>
                  </div>
                </article>
              ) : null}
            </>
          ) : (
            <article className="card">
              <h1>Ingen leksjon valgt</h1>
              <p>Velg en leksjon fra listen for å starte.</p>
            </article>
          )}
        </section>
      </section>
    </div>
  );
}
