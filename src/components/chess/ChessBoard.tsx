import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Chess, type Square } from "chess.js";
import { ChessPiece } from "./ChessPieces";
import { getSquareColor } from "@/lib/chess-engine";
import { playChessSound } from "@/lib/chess-sounds";

interface MoveInfo {
  from: Square;
  to: Square;
  captured?: boolean;
  isCheck?: boolean;
  isCastle?: boolean;
  isPromotion?: boolean;
  isGameOver?: boolean;
}

interface ChessBoardProps {
  game: Chess;
  onMove: (from: Square, to: Square) => boolean;
  playerColor?: "white" | "black";
  disabled?: boolean;
  lastMoveInfo?: MoveInfo | null;
}

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];

function squareToGrid(square: Square, isFlipped: boolean): { row: number; col: number } {
  const col = FILES.indexOf(square[0]);
  const row = RANKS.indexOf(square[1]);
  return {
    row: isFlipped ? 7 - row : row,
    col: isFlipped ? 7 - col : col,
  };
}

export function ChessBoard({ game, onMove, playerColor = "white", disabled = false, lastMoveInfo }: ChessBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [animating, setAnimating] = useState<{
    type: string; color: "white" | "black";
    fromRow: number; fromCol: number; toRow: number; toCol: number;
  } | null>(null);
  const [capturedSquare, setCapturedSquare] = useState<Square | null>(null);
  const [checkSquare, setCheckSquare] = useState<Square | null>(null);
  const [sqSize, setSqSize] = useState(48);
  const containerRef = useRef<HTMLDivElement>(null);

  const isFlipped = playerColor === "black";
  const files = isFlipped ? [...FILES].reverse() : FILES;
  const ranks = isFlipped ? [...RANKS].reverse() : RANKS;

  const board = useMemo(() => game.board(), [game.fen()]);

  // Calculate stable square size based on container
  useEffect(() => {
    function calc() {
      if (typeof window === "undefined") return;
      const vw = window.innerWidth;
      // On mobile use almost full width, on desktop cap at 72px
      const maxBoard = Math.min(vw - 32, 576); // 576 = 72*8
      const s = Math.floor(maxBoard / 8);
      setSqSize(Math.max(36, Math.min(72, s)));
    }
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  // Detect check square
  useEffect(() => {
    if (game.isCheck()) {
      const turn = game.turn();
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = board[r]?.[c];
          if (p && p.type === "k" && p.color === turn) {
            setCheckSquare(`${FILES[c]}${RANKS[r]}` as Square);
            return;
          }
        }
      }
    } else {
      setCheckSquare(null);
    }
  }, [game.fen(), board]);

  // Play sounds on lastMoveInfo change
  useEffect(() => {
    if (!lastMoveInfo) return;
    if (lastMoveInfo.isGameOver) {
      playChessSound("gameOver");
    } else if (lastMoveInfo.isCheck) {
      playChessSound("check");
    } else if (lastMoveInfo.isPromotion) {
      playChessSound("promotion");
    } else if (lastMoveInfo.isCastle) {
      playChessSound("castle");
    } else if (lastMoveInfo.captured) {
      playChessSound("capture");
    } else {
      playChessSound("move");
    }
  }, [lastMoveInfo]);

  const handleSquareClick = useCallback((square: Square) => {
    if (disabled) return;

    if (selectedSquare) {
      if (legalMoves.includes(square)) {
        const piece = game.get(selectedSquare);
        const targetPiece = game.get(square);

        if (piece) {
          const from = squareToGrid(selectedSquare, isFlipped);
          const to = squareToGrid(square, isFlipped);

          if (targetPiece) {
            setCapturedSquare(square);
            setTimeout(() => setCapturedSquare(null), 200);
          }

          setAnimating({
            type: piece.type,
            color: piece.color === "w" ? "white" : "black",
            fromRow: from.row, fromCol: from.col,
            toRow: to.row, toCol: to.col,
          });

          setTimeout(() => {
            const success = onMove(selectedSquare, square);
            setAnimating(null);
            if (!success) playChessSound("illegal");
          }, 150);
        }

        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }
      setSelectedSquare(null);
      setLegalMoves([]);
    }

    const piece = game.get(square);
    if (piece && piece.color === (playerColor === "white" ? "w" : "b")) {
      setSelectedSquare(square);
      playChessSound("select");
      const moves = game.moves({ square, verbose: true });
      setLegalMoves(moves.map(m => m.to as Square));
    }
  }, [selectedSquare, legalMoves, game, onMove, playerColor, disabled, isFlipped]);

  const lastMove = useMemo(() => {
    const history = game.history({ verbose: true });
    return history.length > 0 ? history[history.length - 1] : null;
  }, [game.fen()]);

  const boardSize = sqSize * 8;
  const pieceSize = Math.round(sqSize * 0.85);

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ width: boardSize, height: boardSize }}
    >
      {/* Board squares — absolute positioned, no grid */}
      <div
        className="rounded-lg overflow-hidden"
        style={{
          width: boardSize,
          height: boardSize,
          boxShadow: "0 0 40px oklch(0.55 0.25 270 / 0.15)",
          position: "relative",
        }}
      >
        {ranks.map((rank, rowIdx) =>
          files.map((file, colIdx) => {
            const square = `${file}${rank}` as Square;
            const realRow = isFlipped ? 7 - rowIdx : rowIdx;
            const realCol = isFlipped ? 7 - colIdx : colIdx;
            const sqColor = getSquareColor(realRow, realCol);
            const piece = board[realRow]?.[realCol];
            const isSelected = selectedSquare === square;
            const isLegal = legalMoves.includes(square);
            const isLastMoveSquare = lastMove && (lastMove.from === square || lastMove.to === square);
            const isCheck = checkSquare === square;
            const isCapturedFading = capturedSquare === square;
            const isAnimSource = animating && rowIdx === animating.fromRow && colIdx === animating.fromCol;

            return (
              <button
                key={square}
                onClick={() => handleSquareClick(square)}
                style={{
                  position: "absolute",
                  left: colIdx * sqSize,
                  top: rowIdx * sqSize,
                  width: sqSize,
                  height: sqSize,
                  backgroundColor: isCheck
                    ? "oklch(0.55 0.30 25)"
                    : isSelected
                    ? "var(--board-selected)"
                    : isLastMoveSquare
                    ? sqColor === "light" ? "oklch(0.78 0.10 100)" : "oklch(0.50 0.14 270)"
                    : sqColor === "light"
                    ? "var(--board-light)"
                    : "var(--board-dark)",
                  transition: "background-color 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "none",
                  padding: 0,
                  cursor: disabled ? "default" : "pointer",
                  outline: "none",
                }}
              >
                {/* Check glow */}
                {isCheck && (
                  <div className="absolute inset-0 animate-pulse-glow" style={{
                    boxShadow: "inset 0 0 12px oklch(0.6 0.3 25 / 0.6)",
                  }} />
                )}

                {/* Coordinate labels */}
                {colIdx === 0 && (
                  <span className="absolute top-0.5 left-1 text-[9px] font-bold opacity-50 select-none pointer-events-none"
                    style={{ color: sqColor === "light" ? "var(--board-dark)" : "var(--board-light)" }}>
                    {rank}
                  </span>
                )}
                {rowIdx === 7 && (
                  <span className="absolute bottom-0 right-1 text-[9px] font-bold opacity-50 select-none pointer-events-none"
                    style={{ color: sqColor === "light" ? "var(--board-dark)" : "var(--board-light)" }}>
                    {file}
                  </span>
                )}

                {/* Piece */}
                {piece && !isAnimSource && (
                  <div
                    style={{
                      position: "relative",
                      zIndex: 10,
                      opacity: isCapturedFading ? 0 : 1,
                      transform: isCapturedFading ? "scale(0.5)" : "scale(1)",
                      transition: "opacity 0.2s ease, transform 0.2s ease",
                    }}
                  >
                    <ChessPiece type={piece.type} color={piece.color === "w" ? "white" : "black"} size={pieceSize} />
                  </div>
                )}

                {/* Selected ring */}
                {isSelected && (
                  <div className="absolute inset-0 pointer-events-none" style={{
                    border: "2px solid var(--primary)",
                    opacity: 0.8,
                  }} />
                )}

                {/* Legal move dot */}
                {isLegal && !piece && (
                  <div style={{
                    position: "absolute",
                    width: sqSize * 0.25,
                    height: sqSize * 0.25,
                    borderRadius: "50%",
                    backgroundColor: "var(--board-highlight)",
                    opacity: 0.6,
                  }} />
                )}

                {/* Legal capture ring */}
                {isLegal && piece && (
                  <div className="absolute inset-0 pointer-events-none" style={{
                    border: "3px solid var(--board-highlight)",
                    opacity: 0.6,
                  }} />
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Animated floating piece — OUTSIDE the board layout */}
      {animating && (
        <div
          style={{
            position: "absolute",
            zIndex: 50,
            pointerEvents: "none",
            width: sqSize,
            height: sqSize,
            left: animating.fromCol * sqSize,
            top: animating.fromRow * sqSize,
            transform: `translate(${(animating.toCol - animating.fromCol) * sqSize}px, ${(animating.toRow - animating.fromRow) * sqSize}px)`,
            transition: "transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.4))",
          }}
        >
          <ChessPiece type={animating.type} color={animating.color} size={pieceSize} />
        </div>
      )}
    </div>
  );
}
