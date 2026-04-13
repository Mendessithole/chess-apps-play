import React from "react";
import { type Chess } from "chess.js";
import { Button } from "@/components/ui/button";
import { formatTime, type AIDifficulty, AI_LEVELS } from "@/lib/chess-engine";
import { RotateCcw, Flag, ChevronLeft, ChevronRight, Home } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface GameControlsProps {
  game: Chess;
  whiteTime: number;
  blackTime: number;
  playerColor: "white" | "black";
  aiDifficulty?: AIDifficulty;
  status: string;
  moveHistory: string[];
  onResign: () => void;
  onNewGame: () => void;
}

export function GameControls({
  game,
  whiteTime,
  blackTime,
  playerColor,
  aiDifficulty,
  status,
  moveHistory,
  onResign,
  onNewGame,
}: GameControlsProps) {
  const opponentTime = playerColor === "white" ? blackTime : whiteTime;
  const playerTime = playerColor === "white" ? whiteTime : blackTime;
  const currentTurn = game.turn() === "w" ? "White" : "Black";
  const aiInfo = aiDifficulty ? AI_LEVELS[aiDifficulty] : null;

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Opponent Info */}
      <div className="flex items-center justify-between bg-surface rounded-lg p-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-heading text-sm font-bold text-secondary-foreground">
            {aiInfo ? "🤖" : "♟"}
          </div>
          <div>
            <p className="font-heading font-semibold text-surface-foreground">
              {aiInfo ? `AI ${aiInfo.label}` : "Opponent"}
            </p>
            <p className="text-xs text-muted-foreground">
              {aiInfo ? `ELO ${aiInfo.elo}` : "Online"}
            </p>
          </div>
        </div>
        <div className="bg-background px-4 py-2 rounded-md font-heading text-lg font-bold tabular-nums text-foreground">
          {formatTime(opponentTime)}
        </div>
      </div>

      {/* Status */}
      <div className="bg-surface rounded-lg p-3 text-center">
        <p className="font-heading text-sm font-medium text-primary">
          {status || `${currentTurn} to move`}
        </p>
      </div>

      {/* Move History */}
      <div className="flex-1 bg-surface rounded-lg p-3 overflow-hidden">
        <h3 className="font-heading text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Moves</h3>
        <div className="overflow-y-auto max-h-[240px] space-y-0.5">
          {Array.from({ length: Math.ceil(moveHistory.length / 2) }, (_, i) => (
            <div key={i} className="flex items-center text-sm gap-2">
              <span className="text-muted-foreground w-6 text-right font-mono text-xs">{i + 1}.</span>
              <span className="font-mono text-surface-foreground w-16">{moveHistory[i * 2]}</span>
              {moveHistory[i * 2 + 1] && (
                <span className="font-mono text-surface-foreground w-16">{moveHistory[i * 2 + 1]}</span>
              )}
            </div>
          ))}
          {moveHistory.length === 0 && (
            <p className="text-muted-foreground text-xs italic">No moves yet</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onNewGame} className="flex-1 gap-1">
          <RotateCcw className="w-4 h-4" /> New Game
        </Button>
        <Button variant="destructive" size="sm" onClick={onResign} className="flex-1 gap-1" disabled={game.isGameOver()}>
          <Flag className="w-4 h-4" /> Resign
        </Button>
      </div>

      <Link to="/">
        <Button variant="ghost" size="sm" className="w-full gap-1 text-muted-foreground">
          <Home className="w-4 h-4" /> Back to Lobby
        </Button>
      </Link>

      {/* Player Info */}
      <div className="flex items-center justify-between bg-surface rounded-lg p-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-heading text-sm font-bold text-primary-foreground">
            You
          </div>
          <div>
            <p className="font-heading font-semibold text-surface-foreground">Player</p>
            <p className="text-xs text-muted-foreground">ELO 1200</p>
          </div>
        </div>
        <div className="bg-background px-4 py-2 rounded-md font-heading text-lg font-bold tabular-nums text-foreground">
          {formatTime(playerTime)}
        </div>
      </div>
    </div>
  );
}
