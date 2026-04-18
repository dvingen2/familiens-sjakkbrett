import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { PieceSymbol, Square } from "chess.js";
import { FILES, RANKS, getTurn, legalMovesForSquare, listSquares } from "../lib/chess";
import type { MoveRecord, Side } from "../types";

interface ChessBoardProps {
  fen: string;
  orientation?: Side;
  movableColor?: Side | "both";
  interactive?: boolean;
  lastMove?: Pick<MoveRecord, "id" | "from" | "to"> | null;
  animateLastMove?: boolean;
  highlightSquares?: Square[];
  onSquareSelect?: (square: Square) => void;
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

interface MoveAnimation {
  id: string;
  to: Square;
  pieceSrc: string;
  pieceAlt: string;
  x: number;
  y: number;
  size: number;
  dx: number;
  dy: number;
  tilt: number;
  active: boolean;
}

const HOLD_DELAY_MS = 280;
const PIECE_ASSETS: Record<Side, Record<PieceSymbol, string>> = {
  w: {
    p: new URL("../../brikker/bonde_Filled=False.svg", import.meta.url).href,
    n: new URL("../../brikker/springer_Filled=False-2.svg", import.meta.url).href,
    b: new URL("../../brikker/løper_Filled=False-3.svg", import.meta.url).href,
    r: new URL("../../brikker/tarn_Filled=False-1.svg", import.meta.url).href,
    q: new URL("../../brikker/dronning_Filled=False-4.svg", import.meta.url).href,
    k: new URL("../../brikker/konge_Filled=False-5.svg", import.meta.url).href,
  },
  b: {
    p: new URL("../../brikker/bonde_Filled=True.svg", import.meta.url).href,
    n: new URL("../../brikker/springer_Filled=True-2.svg", import.meta.url).href,
    b: new URL("../../brikker/løper_Filled=True-3.svg", import.meta.url).href,
    r: new URL("../../brikker/tarn_Filled=True-1.svg", import.meta.url).href,
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
  lastMove = null,
  animateLastMove = true,
  highlightSquares = [],
  onSquareSelect,
  onMove,
}: ChessBoardProps) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const holdTimerRef = useRef<number | null>(null);
  const activePointerRef = useRef<number | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalTargets, setLegalTargets] = useState<Square[]>([]);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [moveAnimation, setMoveAnimation] = useState<MoveAnimation | null>(null);

  const chessState = useMemo(() => parseFen(fen), [fen]);
  const orderedSquares = useMemo(() => orientSquares(orientation), [orientation]);
  const turn = useMemo(() => getTurn(fen), [fen]);

  useEffect(() => {
    return () => {
      window.clearTimeout(holdTimerRef.current ?? undefined);
    };
  }, []);

  useEffect(() => {
    if (!lastMove || !boardRef.current || !animateLastMove) {
      setMoveAnimation(null);
      return;
    }

    const fromSquare = lastMove.from as Square;
    const toSquare = lastMove.to as Square;
    const movedPiece = chessState.get(toSquare);
    if (!movedPiece) {
      setMoveAnimation(null);
      return;
    }

    const boardSize = boardRef.current.clientWidth;
    if (!boardSize) {
      return;
    }

    const squareSize = boardSize / 8;
    const fromPosition = getSquarePosition(fromSquare, orientation, squareSize);
    const toPosition = getSquarePosition(toSquare, orientation, squareSize);

    const nextAnimation: MoveAnimation = {
      id: lastMove.id,
      to: toSquare,
      pieceSrc: PIECE_ASSETS[movedPiece.color][movedPiece.type],
      pieceAlt: `${movedPiece.color === "w" ? "Hvit" : "Sort"} ${PIECE_NAMES[movedPiece.type]}`,
      x: fromPosition.x,
      y: fromPosition.y,
      size: squareSize,
      dx: toPosition.x - fromPosition.x,
      dy: toPosition.y - fromPosition.y,
      tilt: Math.max(-8, Math.min(8, (toPosition.x - fromPosition.x) / squareSize * 2.2)),
      active: false,
    };

    setMoveAnimation(nextAnimation);

    const frame = window.requestAnimationFrame(() => {
      setMoveAnimation((current) => (current?.id === nextAnimation.id ? { ...current, active: true } : current));
    });

    const timeout = window.setTimeout(() => {
      setMoveAnimation((current) => (current?.id === nextAnimation.id ? null : current));
    }, 320);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [animateLastMove, chessState, lastMove, orientation]);

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
    if (!interactive && onSquareSelect) {
      onSquareSelect(square);
      return;
    }

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
    onSquareSelect?.(square);
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
          const isLastFrom = lastMove?.from === square;
          const isLastTo = lastMove?.to === square;
          const isHighlighted = highlightSquares.includes(square);
          const hidePieceForAnimation = moveAnimation?.to === square;

          return (
            <div
              key={square}
              className={[
                "square",
                isDark ? "square-dark" : "square-light",
                isSelected ? "square-selected" : "",
                isTarget ? "square-target" : "",
                isLastFrom ? "square-last-from" : "",
                isLastTo ? "square-last-to" : "",
                isHighlighted ? "square-highlight" : "",
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
              {piece && !hidePieceForAnimation ? (
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
      {moveAnimation ? (
        <div
          className={`move-ghost ${moveAnimation.active ? "move-ghost-active" : ""}`}
          style={{
            width: `${moveAnimation.size}px`,
            height: `${moveAnimation.size}px`,
            left: `${moveAnimation.x}px`,
            top: `${moveAnimation.y}px`,
            transform: moveAnimation.active
              ? `translate(${moveAnimation.dx}px, ${moveAnimation.dy}px) scale(1.05) rotate(${moveAnimation.tilt * 0.35}deg)`
              : `translate(0, 0) scale(0.92) rotate(${moveAnimation.tilt}deg)`,
          }}
          aria-hidden="true"
        >
          <img className="move-ghost-image" src={moveAnimation.pieceSrc} alt={moveAnimation.pieceAlt} />
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

function getSquarePosition(square: Square, orientation: Side, squareSize: number) {
  const file = square[0] as (typeof FILES)[number];
  const rank = Number(square[1]) as (typeof RANKS)[number];
  const fileIndex = FILES.indexOf(file);
  const rankIndex = RANKS.indexOf(rank);

  if (orientation === "w") {
    return {
      x: fileIndex * squareSize,
      y: rankIndex * squareSize,
    };
  }

  return {
    x: (7 - fileIndex) * squareSize,
    y: (7 - rankIndex) * squareSize,
  };
}
