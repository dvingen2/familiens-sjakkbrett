import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { PieceSymbol, Square } from "chess.js";
import { FILES, PIECE_SYMBOLS, RANKS, getTurn, legalMovesForSquare, listSquares } from "../lib/chess";
import type { Side } from "../types";

interface ChessBoardProps {
  fen: string;
  orientation?: Side;
  interactive?: boolean;
  onMove?: (from: Square, to: Square) => boolean;
}

interface DragState {
  from: Square;
  piece: string;
  x: number;
  y: number;
}

interface BoardPiece {
  square: Square;
  type: PieceSymbol;
  color: Side;
}

const HOLD_DELAY_MS = 280;

export function ChessBoard({
  fen,
  orientation = "w",
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
    if (!interactive || piece.color !== turn) {
      return;
    }

    activePointerRef.current = event.pointerId;
    boardRef.current?.setPointerCapture?.(event.pointerId);

    holdTimerRef.current = window.setTimeout(() => {
      beginSelection(piece.square);
      setDragState({
        from: piece.square,
        piece: PIECE_SYMBOLS[piece.color][piece.type],
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

    if (piece && piece.color === turn) {
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
                  aria-label={`${piece.color === "w" ? "Hvit" : "Sort"} ${piece.type} på ${square}`}
                >
                  {PIECE_SYMBOLS[piece.color][piece.type]}
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
          {dragState.piece}
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
