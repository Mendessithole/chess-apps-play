import { Chess, type Square, type Move } from "chess.js";

export type GameSpeed = "bullet" | "blitz" | "rapid" | "daily";
export type GameMode = "ai" | "online" | "odds" | "simul";
export type AIDifficulty = "beginner" | "intermediate" | "advanced" | "master";

export interface GameConfig {
  speed: GameSpeed;
  mode: GameMode;
  aiDifficulty?: AIDifficulty;
  timeControl?: { initial: number; increment: number };
  playerColor?: "white" | "black";
}

export const SPEED_CONFIGS: Record<GameSpeed, { label: string; icon: string; time: string; initial: number; increment: number }> = {
  bullet: { label: "Bullet", icon: "⚡", time: "1+0", initial: 60, increment: 0 },
  blitz: { label: "Blitz", icon: "🔥", time: "3+2", initial: 180, increment: 2 },
  rapid: { label: "Rapid", icon: "⏱️", time: "10+5", initial: 600, increment: 5 },
  daily: { label: "Daily", icon: "📅", time: "1 day", initial: 86400, increment: 0 },
};

export const AI_LEVELS: Record<AIDifficulty, { label: string; elo: string; description: string }> = {
  beginner: { label: "Beginner", elo: "400-800", description: "Makes frequent mistakes" },
  intermediate: { label: "Intermediate", elo: "800-1200", description: "Solid fundamentals" },
  advanced: { label: "Advanced", elo: "1200-1800", description: "Tactical awareness" },
  master: { label: "Master", elo: "1800-2200", description: "Strategic depth" },
};

export function getAIMove(game: Chess, difficulty: AIDifficulty): Move | null {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;

  switch (difficulty) {
    case "beginner":
      return moves[Math.floor(Math.random() * moves.length)];
    case "intermediate":
      return pickWeightedMove(game, moves, 0.3);
    case "advanced":
      return pickWeightedMove(game, moves, 0.6);
    case "master":
      return pickWeightedMove(game, moves, 0.85);
    default:
      return moves[0];
  }
}

function pickWeightedMove(game: Chess, moves: Move[], quality: number): Move {
  const scored = moves.map(move => {
    let score = 0;
    game.move(move);
    if (game.isCheckmate()) score += 1000;
    if (game.isCheck()) score += 50;
    game.undo();
    
    if (move.captured) {
      const values: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };
      score += (values[move.captured] || 0) * 10;
    }
    
    // Center control bonus
    const centerSquares = ["d4", "d5", "e4", "e5"];
    if (centerSquares.includes(move.to)) score += 5;
    
    return { move, score };
  });

  scored.sort((a, b) => b.score - a.score);
  
  // Quality determines how often we pick the best move
  if (Math.random() < quality) {
    const topMoves = scored.slice(0, Math.max(1, Math.floor(scored.length * 0.2)));
    return topMoves[Math.floor(Math.random() * topMoves.length)].move;
  }
  
  return scored[Math.floor(Math.random() * scored.length)].move;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function getSquareColor(row: number, col: number): "light" | "dark" {
  return (row + col) % 2 === 0 ? "light" : "dark";
}
