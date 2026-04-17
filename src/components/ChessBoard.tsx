import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { PieceSymbol, Square } from "chess.js";
import { FILES, RANKS, getTurn, legalMovesForSquare, listSquares } from "../lib/chess";
import type { Side } from "../types";

interface ChessBoardProps {
  fen: string;
  orientation?: Side;
  movableColor?: Side | "both";
  interactive?: boolean;
  onMove?: (from: Square, to: Square) => boolean;
}

interface DragState {
  from: Square;
  pieceSrc: string;
  pieceAlt: string;
  x: number;
  y: number;
}

interface BoardPiece {
  square: Square;
  type: PieceSymbol;
  color: Side;
}

const HOLD_DELAY_MS = 280;
const PIECE_ASSETS: Record<Side, Record<PieceSymbol, string>> = {
  w: {
    p: new URL("../../brikker/bonde_Filled=False.svg", import.meta.url).href,
    n: new URL("../../brikker/springer_Filled=False-2.svg", import.meta.url).href,
    b: new URL("../../brikker/løper_Filled=False-3.svg", import.meta.url).href,
    r: new URL("../../brikker/tårn_Filled=False-1.svg", import.meta.url).href,
    q: new URL("../../brikker/dronning_Filled=False-4.svg", import.meta.url).href,
    k: new URL("../../brikker/konge_Filled=False-5.svg", import.meta.url).href,
  },
  b: {
    p: new URL("../../brikker/bonde_Filled=True.svg", import.meta.url).href,
    n: new URL("../../brikker/springer_Filled=True-2.svg", import.meta.url).href,
    b: new URL("../../brikker/løper_Filled=True-3.svg", import.meta.url).href,
    r: new URL("../../brikker/tårn_Filled=True-1.svg", import.meta.url).href,
    q: new URL("../../brikker/dronning_Filled=True-4.svg", import.meta.url).href,
    k: new URL("../../brikker/konge_Filled=True-5.svg", import.meta.url).href,
  },
};

const PIECE_NAMES: Record<PieceSymbol, string> = {
  p: "bonde",
  n: "springer",
  b: "løper",
  r: "tårn",
  q: "dronning",
  k: "konge",
};

export function ChessBoard({
  fen,
  orientation = "w",
  movableColor = "both",
  interactive = true,
  onMove,
}: ChessBoardProps) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const holdTimerRef = useRef<number | null>(null);
  const activePointerRef = useRef<number | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalTargets, setLegalTargets] = useState<Square[]>([]);
  const [dragState, setDragState] = useState<DragState | null>(null);

  const chessState = useMemo(() => parseFen(fen), [fen]);
  const orderedSquares = useMemo(() => orientSquares(orientation), [orientation]);
  const turn = useMemo(() => getTurn(fen), [fen]);

  useEffect(() => {
    return () => {
      window.clearTimeout(holdTimerRef.current ?? undefined);
    };
  }, []);

  function beginSelection(square: Square) {
    setSelectedSquare(square);
    setLegalTargets(legalMovesForSquare(fen, square));
  }

  function canControlPiece(piece: BoardPiece) {
    if (movableColor === "both") {
      return piece.color === turn;
    }

    return piece.color === turn && piece.color === movableColor;
  }

  function clearInteractionState() {
    setDragState(null);
    if (activePointerRef.current !== null && boardRef.current) {
      boardRef.current.releasePointerCapture?.(activePointerRef.current);
    }
    activePointerRef.current = null;
    window.clearTimeout(holdTimerRef.current ?? undefined);
    holdTimerRef.current = null;
  }

  function onPiecePointerDown(event: ReactPointerEvent<HTMLButtonElement>, piece: BoardPiece) {
    if (!interactive || !canControlPiece(piece)) {
      return;
    }

    activePointerRef.current = event.pointerId;
    boardRef.current?.setPointerCapture?.(event.pointerId);

    holdTimerRef.current = window.setTimeout(() => {
      beginSelection(piece.square);
      setDragState({
        from: piece.square,
        pieceSrc: PIECE_ASSETS[piece.color][piece.type],
        pieceAlt: `${piece.color === "w" ? "Hvit" : "Sort"} ${PIECE_NAMES[piece.type]}`,
        x: event.clientX,
        y: event.clientY,
      });
    }, HOLD_DELAY_MS);
  }

  function onBoardPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragState || activePointerRef.current !== event.pointerId) {
      return;
    }

    setDragState((current) =>
      current
        ? {
            ...current,
            x: event.clientX,
            y: event.clientY,
          }
        : null,
    );
  }

  function resolveSquareFromPoint(clientX: number, clientY: number): Square | null {
    const target = document.elementFromPoint(clientX, clientY);
    const squareElement = target?.closest("[data-square]");

    if (!(squareElement instanceof HTMLElement)) {
      return null;
    }

    return (squareElement.dataset.square as Square | undefined) ?? null;
  }

  function commitMove(from: Square, to: Square) {
    if (legalTargets.includes(to) && onMove?.(from, to)) {
      setSelectedSquare(null);
      setLegalTargets([]);
      return true;
    }

    return false;
  }

  function onBoardPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const pendingSquare = selectedSquare;

    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    if (dragState) {
      const destination = resolveSquareFromPoint(event.clientX, event.clientY);
      if (destination) {
        commitMove(dragState.from, destination);
      }
    } else if (pendingSquare) {
      const destination = resolveSquareFromPoint(event.clientX, event.clientY);
      if (destination && destination !== pendingSquare) {
        commitMove(pendingSquare, destination);
      }
    }

    clearInteractionState();
  }

  function onSquareClick(square: Square, piece?: BoardPiece) {
    if (!interactive) {
      return;
    }

    if (selectedSquare && legalTargets.includes(square) && selectedSquare !== square) {
      const moved = commitMove(selectedSquare, square);
      if (moved) {
        return;
      }
    }

    if (piece && canControlPiece(piece)) {
      beginSelection(square);
      return;
    }

    setSelectedSquare(null);
    setLegalTargets([]);
  }

  return (
    <div className="board-shell">
      <div
        ref={boardRef}
        className="board"
        onPointerMove={onBoardPointerMove}
        onPointerUp={onBoardPointerUp}
        onPointerCancel={clearInteractionState}
      >
        {orderedSquares.map((square) => {
          const piece = chessState.get(square);
          const fileIndex = FILES.indexOf(square[0] as (typeof FILES)[number]);
          const rankIndex = RANKS.indexOf(Number(square[1]) as (typeof RANKS)[number]);
          const isDark = (fileIndex + rankIndex) % 2 === 1;
          const isSelected = selectedSquare === square;
          const isTarget = legalTargets.includes(square);

          return (
            <div
              key={square}
              className={[
                "square",
                isDark ? "square-dark" : "square-light",
                isSelected ? "square-selected" : "",
                isTarget ? "square-target" : "",
              ].join(" ")}
              data-square={square}
              onClick={() => onSquareClick(square, piece)}
              aria-label={`Felt ${square}`}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSquareClick(square, piece);
                }
              }}
            >
              <span className="coord-file">{square[0]}</span>
              <span className="coord-rank">{square[1]}</span>
              {piece ? (
                <button
                  type="button"
                  className="piece"
                  onPointerDown={(event) => onPiecePointerDown(event, piece)}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSquareClick(square, piece);
                  }}
                  aria-label={`${piece.color === "w" ? "Hvit" : "Sort"} ${PIECE_NAMES[piece.type]} på ${square}`}
                >
                  <img
                    className="piece-image"
                    src={PIECE_ASSETS[piece.color][piece.type]}
                    alt=""
                    draggable="false"
                  />
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      {dragState ? (
        <div
          className="drag-ghost"
          style={{ left: dragState.x, top: dragState.y }}
          aria-hidden="true"
        >
          <img className="drag-ghost-image" src={dragState.pieceSrc} alt={dragState.pieceAlt} />
        </div>
      ) : null}
    </div>
  );
}

function parseFen(fen: string): Map<Square, BoardPiece> {
  const [placement] = fen.split(" ");
  const rows = placement.split("/");
  const squares = listSquares();
  const map = new Map<Square, BoardPiece>();
  let cursor = 0;

  rows.forEach((row) => {
    for (const char of row) {
      if (/\d/.test(char)) {
        cursor += Number(char);
        continue;
      }

      const square = squares[cursor];
      const color = char === char.toUpperCase() ? "w" : "b";
      const type = char.toLowerCase() as PieceSymbol;

      map.set(square, { square, color, type });
      cursor += 1;
    }
  });

  return map;
}

function orientSquares(orientation: Side): Square[] {
  const base = listSquares();

  if (orientation === "w") {
    return base;
  }

  return [...base].reverse();
}
