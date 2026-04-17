import type { Side } from "../types";

interface TurnIndicatorProps {
  turn: Side;
  whiteLabel?: string;
  blackLabel?: string;
  statusText?: string;
}

export function TurnIndicator({
  turn,
  whiteLabel = "Hvit",
  blackLabel = "Sort",
  statusText,
}: TurnIndicatorProps) {
  return (
    <div className="turn-indicator-wrap">
      <div className="turn-indicator" aria-label={`${turn === "w" ? "Hvit" : "Sort"} i trekk`}>
        <span className={`turn-side turn-side-white ${turn === "w" ? "is-active" : ""}`}>
          <strong>Hvit</strong>
          <small>{whiteLabel}</small>
        </span>
        <span className={`turn-side turn-side-black ${turn === "b" ? "is-active" : ""}`}>
          <strong>Sort</strong>
          <small>{blackLabel}</small>
        </span>
      </div>
      {statusText ? <span className="turn-indicator-status">{statusText}</span> : null}
    </div>
  );
}
