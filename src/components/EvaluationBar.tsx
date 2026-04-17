import type { PositionEvaluation } from "../lib/stockfish";

interface EvaluationBarProps {
  evaluation: PositionEvaluation | null;
  whiteLabel: string;
  blackLabel: string;
  isAnalyzing?: boolean;
}

export function EvaluationBar({
  evaluation,
  whiteLabel,
  blackLabel,
  isAnalyzing = false,
}: EvaluationBarProps) {
  const whitePercent = evaluation ? Math.round(evaluation.whiteChance * 100) : 50;
  const blackPercent = 100 - whitePercent;

  return (
    <div className="evaluation-card">
      <div className="evaluation-header">
        <strong>Balansen i stillingen</strong>
        <span>{isAnalyzing ? "Analyserer..." : evaluationLabel(evaluation)}</span>
      </div>

      <div className="evaluation-bar" aria-label={`Hvit ${whitePercent} prosent, sort ${blackPercent} prosent`}>
        <div className="evaluation-bar-white" style={{ width: `${whitePercent}%` }} />
        <div className="evaluation-bar-black" style={{ width: `${blackPercent}%` }} />
      </div>

      <div className="evaluation-scale">
        <div>
          <strong>{whitePercent}%</strong>
          <span>Hvit · {whiteLabel}</span>
        </div>
        <div className="evaluation-scale-right">
          <strong>{blackPercent}%</strong>
          <span>Sort · {blackLabel}</span>
        </div>
      </div>
    </div>
  );
}

function evaluationLabel(evaluation: PositionEvaluation | null) {
  if (!evaluation) {
    return "Venter på analyse";
  }

  if (evaluation.type === "mate") {
    return evaluation.rawValue > 0 ? "Hvit har mattangrep" : "Sort har mattangrep";
  }

  const advantage = evaluation.whiteAdvantage;

  if (Math.abs(advantage) < 0.45) {
    return "Står ganske jevnt";
  }

  if (advantage > 2.8) {
    return "Klart hvitt overtak";
  }

  if (advantage > 0) {
    return "Lite hvitt overtak";
  }

  if (advantage < -2.8) {
    return "Klart sort overtak";
  }

  return "Lite sort overtak";
}
