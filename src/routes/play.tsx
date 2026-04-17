import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Chess, type Square, type PieceSymbol } from "chess.js";
import { ChessBoard } from "@/components/chess/ChessBoard";
import { GameControls } from "@/components/chess/GameControls";
import { CrazyhousePocketBar } from "@/components/chess/CrazyhousePocket";
import { Button } from "@/components/ui/button";
import { getAIMove, SPEED_CONFIGS, type AIDifficulty, type GameSpeed } from "@/lib/chess-engine";
import { playChessSound } from "@/lib/chess-sounds";
import {
  type VariantId, VARIANTS,
  generateChess960Fen,
  checkKingOfTheHill, getHillSquares,
  getVisibleSquares,
  emptyPocket, addToPocket, removeFromPocket, dropPiece, type CrazyhousePocket,
  getRandomPuzzle, type ChessPuzzle,
} from "@/lib/chess-variants";
import { Lightbulb, RotateCw } from "lucide-react";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "Play — Chess with AI" },
      { name: "description", content: "Play chess against AI opponents" },
      { property: "og:title", content: "Play — Chess with AI" },
      { property: "og:description", content: "Play chess against AI opponents" },
    ],
  }),
  component: PlayPage,
  validateSearch: (search: Record<string, unknown>) => ({
    speed: (search.speed as GameSpeed) || "blitz",
    difficulty: (search.difficulty as AIDifficulty) || "intermediate",
    color: (search.color as string) || "white",
    variant: (search.variant as VariantId) || "standard",
  }),
});

interface MoveInfo {
  from: Square;
  to: Square;
  captured?: boolean;
  isCheck?: boolean;
  isCastle?: boolean;
  isPromotion?: boolean;
  isGameOver?: boolean;
}

function buildInitialGame(variant: VariantId, puzzle: ChessPuzzle | null): Chess {
  if (variant === "chess960") return new Chess(generateChess960Fen());
  if (variant === "puzzle" && puzzle) return new Chess(puzzle.fen);
  return new Chess();
}

function PlayPage() {
  const { speed, difficulty, color, variant } = Route.useSearch();
  const playerColor = (color === "black" ? "black" : "white") as "white" | "black";
  const speedConfig = SPEED_CONFIGS[speed as GameSpeed];
  const variantInfo = VARIANTS[variant];

  // Puzzle state (for puzzle variant)
  const [puzzle, setPuzzle] = useState<ChessPuzzle | null>(() => variant === "puzzle" ? getRandomPuzzle() : null);
  const [puzzleStep, setPuzzleStep] = useState(0);
  const [puzzleStatus, setPuzzleStatus] = useState<"playing" | "solved" | "failed">("playing");

  const [game, setGame] = useState(() => buildInitialGame(variant, puzzle));
  const [whiteTime, setWhiteTime] = useState(speedConfig.initial);
  const [blackTime, setBlackTime] = useState(speedConfig.initial);
  const [status, setStatus] = useState("");
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [lastMoveInfo, setLastMoveInfo] = useState<MoveInfo | null>(null);

  // Crazyhouse state
  const [pocket, setPocket] = useState<CrazyhousePocket>(() => emptyPocket());
  const [selectedDrop, setSelectedDrop] = useState<PieceSymbol | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Determine who plays which color in puzzle mode
  const puzzlePlayerColor: "white" | "black" = useMemo(() => {
    if (variant !== "puzzle" || !puzzle) return playerColor;
    return puzzle.fen.split(" ")[1] === "w" ? "white" : "black";
  }, [variant, puzzle, playerColor]);

  const effectivePlayerColor = variant === "puzzle" ? puzzlePlayerColor : playerColor;

  // Visible squares for fog of war
  const visibleSquares = useMemo(() => {
    if (variant !== "fogofwar") return undefined;
    return getVisibleSquares(game, effectivePlayerColor === "white" ? "w" : "b");
  }, [variant, game, effectivePlayerColor]);

  const hillSquares = variant === "kingofthehill" ? getHillSquares() : undefined;

  const updateStatus = useCallback((g: Chess) => {
    // King of the Hill check
    if (variant === "kingofthehill") {
      const hill = checkKingOfTheHill(g);
      if (hill.winner) {
        setStatus(`${hill.winner === "w" ? "White" : "Black"} reaches the hill — wins!`);
        return true;
      }
    }
    if (g.isCheckmate()) {
      const winner = g.turn() === "w" ? "Black" : "White";
      setStatus(`Checkmate! ${winner} wins!`);
      return true;
    }
    if (g.isDraw()) { setStatus("Draw!"); return true; }
    if (g.isStalemate()) { setStatus("Stalemate!"); return true; }
    if (g.isCheck()) { setStatus("Check!"); return false; }
    setStatus("");
    return false;
  }, [variant]);

  const buildMoveInfo = useCallback((g: Chess): MoveInfo | null => {
    const history = g.history({ verbose: true });
    const last = history.length > 0 ? history[history.length - 1] : null;
    if (!last) return null;
    return {
      from: last.from as Square,
      to: last.to as Square,
      captured: !!last.captured,
      isCheck: g.isCheck(),
      isCastle: last.flags.includes("k") || last.flags.includes("q"),
      isPromotion: !!last.promotion,
      isGameOver: g.isGameOver(),
    };
  }, []);

  const makeAIMove = useCallback((g: Chess) => {
    setTimeout(() => {
      const aiMove = getAIMove(g, difficulty);
      if (aiMove) {
        const captured = aiMove.captured;
        g.move(aiMove);
        setMoveHistory(g.history());

        // Crazyhouse: AI captured a piece — add to AI's pocket
        if (variant === "crazyhouse" && captured) {
          // AI is opposite of player
          const aiColorChar = effectivePlayerColor === "white" ? "b" : "w";
          setPocket(p => addToPocket(p, aiColorChar, captured as PieceSymbol));
        }

        const newGame = new Chess(g.fen());
        setGame(newGame);
        setLastMoveInfo(buildMoveInfo(g));
        updateStatus(g);
      }
    }, 300 + Math.random() * 700);
  }, [difficulty, updateStatus, buildMoveInfo, variant, effectivePlayerColor]);

  // If player is black, AI moves first (standard, chess960, koth, fog, crazyhouse)
  useEffect(() => {
    if (variant === "puzzle") return;
    if (effectivePlayerColor === "black" && !gameStarted) {
      setGameStarted(true);
      makeAIMove(game);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMove = useCallback((from: Square, to: Square): boolean => {
    const gameCopy = new Chess(game.fen());
    let moveResult;
    try {
      moveResult = gameCopy.move({ from, to, promotion: "q" });
    } catch {
      return false;
    }

    // Crazyhouse: capture goes to player's pocket
    if (variant === "crazyhouse" && moveResult.captured) {
      const playerColorChar = effectivePlayerColor === "white" ? "w" : "b";
      setPocket(p => addToPocket(p, playerColorChar, moveResult.captured as PieceSymbol));
    }

    // Puzzle: validate against solution
    if (variant === "puzzle" && puzzle) {
      const expected = puzzle.solution[puzzleStep];
      if (moveResult.san !== expected) {
        setPuzzleStatus("failed");
        setStatus(`Wrong move! Expected: ${expected}`);
        playChessSound("illegal");
        return false;
      }
      const nextStep = puzzleStep + 1;
      setPuzzleStep(nextStep);
      if (nextStep >= puzzle.solution.length) {
        setPuzzleStatus("solved");
        setStatus("✓ Puzzle solved!");
        playChessSound("gameOver");
      }
    }

    setGame(new Chess(gameCopy.fen()));
    setMoveHistory(gameCopy.history());
    setGameStarted(true);
    setLastMoveInfo(buildMoveInfo(gameCopy));

    const isOver = updateStatus(gameCopy);
    if (!isOver && variant !== "puzzle") {
      makeAIMove(gameCopy);
    }
    return true;
  }, [game, updateStatus, makeAIMove, buildMoveInfo, variant, effectivePlayerColor, puzzle, puzzleStep]);

  // Crazyhouse drop handler
  const handleDrop = useCallback((square: Square): boolean => {
    if (!selectedDrop) return false;
    const playerColorChar = effectivePlayerColor === "white" ? "w" : "b";
    const newGame = dropPiece(game, square, selectedDrop, playerColorChar);
    if (!newGame) return false;

    setGame(newGame);
    setPocket(p => removeFromPocket(p, effectivePlayerColor, selectedDrop));
    setSelectedDrop(null);
    setMoveHistory(h => [...h, `${selectedDrop.toUpperCase()}@${square}`]);
    setGameStarted(true);
    setLastMoveInfo({
      from: square, to: square,
      captured: false, isCheck: newGame.isCheck(),
      isCastle: false, isPromotion: false, isGameOver: newGame.isGameOver(),
    });
    const isOver = updateStatus(newGame);
    if (!isOver) makeAIMove(newGame);
    return true;
  }, [selectedDrop, game, effectivePlayerColor, updateStatus, makeAIMove]);

  // Timer
  useEffect(() => {
    if (!gameStarted || game.isGameOver() || speed === "daily" || variant === "puzzle") return;

    timerRef.current = setInterval(() => {
      if (game.turn() === "w") {
        setWhiteTime((t: number) => {
          if (t <= 0) { setStatus("Black wins on time!"); return 0; }
          return t - 1;
        });
      } else {
        setBlackTime((t: number) => {
          if (t <= 0) { setStatus("White wins on time!"); return 0; }
          return t - 1;
        });
      }
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameStarted, game.turn(), game.isGameOver(), speed, variant]);

  const handleResign = () => {
    const winner = effectivePlayerColor === "white" ? "Black" : "White";
    setStatus(`${winner} wins by resignation!`);
    playChessSound("gameOver");
  };

  const handleNewGame = () => {
    let nextPuzzle: ChessPuzzle | null = null;
    if (variant === "puzzle") {
      nextPuzzle = getRandomPuzzle();
      setPuzzle(nextPuzzle);
      setPuzzleStep(0);
      setPuzzleStatus("playing");
    }
    const newGame = buildInitialGame(variant, nextPuzzle);
    setGame(newGame);
    setWhiteTime(speedConfig.initial);
    setBlackTime(speedConfig.initial);
    setStatus("");
    setMoveHistory([]);
    setGameStarted(false);
    setLastMoveInfo(null);
    setPocket(emptyPocket());
    setSelectedDrop(null);
    if (variant !== "puzzle" && effectivePlayerColor === "black") {
      setTimeout(() => makeAIMove(newGame), 500);
    }
  };

  // Determine if board is disabled
  const isPlayerTurn = game.turn() === (effectivePlayerColor === "white" ? "w" : "b");
  const boardDisabled = game.isGameOver() || !isPlayerTurn || (variant === "puzzle" && puzzleStatus !== "playing");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="flex flex-col lg:flex-row gap-6 items-start max-w-[1100px] w-full animate-slide-up">
        {/* Board column */}
        <div className="flex-shrink-0 flex flex-col gap-3">
          {/* Variant banner */}
          <div className="flex items-center justify-between gap-3 bg-surface border border-border rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{variantInfo.emoji}</span>
              <div>
                <p className="font-heading text-sm font-bold text-foreground leading-tight">{variantInfo.name}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{variantInfo.tagline}</p>
              </div>
            </div>
            <Link to="/" className="text-xs text-primary hover:underline">← Lobby</Link>
          </div>

          {/* Crazyhouse opponent pocket */}
          {variant === "crazyhouse" && (
            <CrazyhousePocketBar
              pocket={pocket}
              color={effectivePlayerColor === "white" ? "black" : "white"}
              selectedDrop={null}
              onSelectDrop={() => {}}
              disabled
              label="AI Pocket"
            />
          )}

          <ChessBoard
            game={game}
            onMove={handleMove}
            playerColor={effectivePlayerColor}
            disabled={boardDisabled}
            lastMoveInfo={lastMoveInfo}
            visibleSquares={visibleSquares}
            highlightSquares={hillSquares}
            dropMode={selectedDrop ? { piece: selectedDrop, color: effectivePlayerColor } : null}
            onDrop={handleDrop}
          />

          {/* Crazyhouse player pocket */}
          {variant === "crazyhouse" && (
            <CrazyhousePocketBar
              pocket={pocket}
              color={effectivePlayerColor}
              selectedDrop={selectedDrop}
              onSelectDrop={setSelectedDrop}
              disabled={boardDisabled}
              label="Your Pocket"
            />
          )}

          {/* Puzzle goal banner */}
          {variant === "puzzle" && puzzle && (
            <div className="bg-surface border border-primary/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb className="w-4 h-4 text-gold" />
                <p className="font-heading text-xs font-bold text-foreground uppercase tracking-wider">{puzzle.theme}</p>
                <span className="ml-auto text-[10px] text-muted-foreground">★ {puzzle.rating}</span>
              </div>
              <p className="text-sm text-muted-foreground">{puzzle.goal}</p>
              {puzzleStatus !== "playing" && (
                <Button onClick={handleNewGame} size="sm" className="mt-2 w-full gap-1">
                  <RotateCw className="w-3 h-3" /> Next Puzzle
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="w-full lg:w-80 lg:min-h-[576px]">
          <GameControls
            game={game}
            whiteTime={whiteTime}
            blackTime={blackTime}
            playerColor={effectivePlayerColor}
            aiDifficulty={variant === "puzzle" ? undefined : difficulty}
            status={status}
            moveHistory={moveHistory}
            onResign={handleResign}
            onNewGame={handleNewGame}
          />
        </div>
      </div>
    </div>
  );
}
