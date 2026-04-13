import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { Chess, type Square } from "chess.js";
import { ChessBoard } from "@/components/chess/ChessBoard";
import { GameControls } from "@/components/chess/GameControls";
import { getAIMove, SPEED_CONFIGS, type AIDifficulty, type GameSpeed } from "@/lib/chess-engine";
import { playChessSound } from "@/lib/chess-sounds";

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

function PlayPage() {
  const { speed, difficulty, color } = Route.useSearch();
  const playerColor = (color === "black" ? "black" : "white") as "white" | "black";
  const speedConfig = SPEED_CONFIGS[speed as GameSpeed];

  const [game, setGame] = useState(() => new Chess());
  const [whiteTime, setWhiteTime] = useState(speedConfig.initial);
  const [blackTime, setBlackTime] = useState(speedConfig.initial);
  const [status, setStatus] = useState("");
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [lastMoveInfo, setLastMoveInfo] = useState<MoveInfo | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateStatus = useCallback((g: Chess) => {
    if (g.isCheckmate()) {
      const winner = g.turn() === "w" ? "Black" : "White";
      setStatus(`Checkmate! ${winner} wins!`);
      return true;
    }
    if (g.isDraw()) {
      setStatus("Draw!");
      return true;
    }
    if (g.isStalemate()) {
      setStatus("Stalemate!");
      return true;
    }
    if (g.isCheck()) {
      setStatus("Check!");
      return false;
    }
    setStatus("");
    return false;
  }, []);

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
        g.move(aiMove);
        setMoveHistory(g.history());
        const newGame = new Chess(g.fen());
        setGame(newGame);
        setLastMoveInfo(buildMoveInfo(g));
        updateStatus(g);
      }
    }, 300 + Math.random() * 700);
  }, [difficulty, updateStatus, buildMoveInfo]);

  // If player is black, AI moves first
  useEffect(() => {
    if (playerColor === "black" && !gameStarted) {
      setGameStarted(true);
      makeAIMove(game);
    }
  }, []);

  const handleMove = useCallback((from: Square, to: Square): boolean => {
    const gameCopy = new Chess(game.fen());
    try {
      gameCopy.move({ from, to, promotion: "q" });
    } catch {
      return false;
    }

    setGame(new Chess(gameCopy.fen()));
    setMoveHistory(gameCopy.history());
    setGameStarted(true);
    setLastMoveInfo(buildMoveInfo(gameCopy));

    const isOver = updateStatus(gameCopy);
    if (!isOver) {
      makeAIMove(gameCopy);
    }
    return true;
  }, [game, updateStatus, makeAIMove, buildMoveInfo]);

  // Timer
  useEffect(() => {
    if (!gameStarted || game.isGameOver() || speed === "daily") return;

    timerRef.current = setInterval(() => {
      if (game.turn() === "w") {
        setWhiteTime(t => {
          if (t <= 0) { setStatus("Black wins on time!"); return 0; }
          return t - 1;
        });
      } else {
        setBlackTime(t => {
          if (t <= 0) { setStatus("White wins on time!"); return 0; }
          return t - 1;
        });
      }
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameStarted, game.turn(), game.isGameOver(), speed]);

  const handleResign = () => {
    const winner = playerColor === "white" ? "Black" : "White";
    setStatus(`${winner} wins by resignation!`);
    playChessSound("gameOver");
  };

  const handleNewGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setWhiteTime(speedConfig.initial);
    setBlackTime(speedConfig.initial);
    setStatus("");
    setMoveHistory([]);
    setGameStarted(false);
    setLastMoveInfo(null);
    if (playerColor === "black") {
      setTimeout(() => makeAIMove(newGame), 500);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="flex flex-col lg:flex-row gap-6 items-start max-w-[1100px] w-full animate-slide-up">
        {/* Board */}
        <div className="flex-shrink-0">
          <ChessBoard
            game={game}
            onMove={handleMove}
            playerColor={playerColor}
            disabled={game.isGameOver() || game.turn() !== (playerColor === "white" ? "w" : "b")}
            lastMoveInfo={lastMoveInfo}
          />
        </div>

        {/* Controls */}
        <div className="w-full lg:w-80 lg:min-h-[576px]">
          <GameControls
            game={game}
            whiteTime={whiteTime}
            blackTime={blackTime}
            playerColor={playerColor}
            aiDifficulty={difficulty}
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
