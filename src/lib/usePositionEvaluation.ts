import { useEffect, useState } from "react";
import { getStockfishEngine, type PositionEvaluation } from "./stockfish";

export function usePositionEvaluation(fen: string | null, depth = 10) {
  const [evaluation, setEvaluation] = useState<PositionEvaluation | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fen) {
      setEvaluation(null);
      return;
    }

    let active = true;
    setIsAnalyzing(true);
    setError(null);

    void getStockfishEngine()
      .analyze(fen, depth)
      .then((nextEvaluation) => {
        if (!active) {
          return;
        }

        setEvaluation(nextEvaluation);
      })
      .catch((cause) => {
        if (!active) {
          return;
        }

        if (cause instanceof Error && cause.message === "Analysis superseded") {
          return;
        }

        setError(cause instanceof Error ? cause.message : "Kunne ikke analysere stillingen.");
      })
      .finally(() => {
        if (active) {
          setIsAnalyzing(false);
        }
      });

    return () => {
      active = false;
    };
  }, [fen, depth]);

  return { evaluation, isAnalyzing, error };
}
