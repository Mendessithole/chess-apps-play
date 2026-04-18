import { Chess, type Square, type PieceSymbol, type Color } from "chess.js";

export type VariantId =
  | "standard"
  | "chess960"
  | "crazyhouse"
  | "kingofthehill"
  | "fogofwar"
  | "puzzle"
  | "atomic"
  | "threecheck"
  | "horde"
  | "antichess"
  | "racingkings";

export type VariantCategory = "classic" | "tactical" | "wild" | "training";

export interface VariantInfo {
  id: VariantId;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  category: VariantCategory;
  difficulty: 1 | 2 | 3; // 1 easy, 2 medium, 3 hard to grasp
}

export const VARIANTS: Record<VariantId, VariantInfo> = {
  standard:      { id: "standard",      name: "Standard",         emoji: "♟️", tagline: "Classic chess",     description: "The traditional rules of chess",                              category: "classic",  difficulty: 1 },
  chess960:      { id: "chess960",      name: "Chess960",         emoji: "🎲", tagline: "Fischer Random",    description: "Back rank pieces shuffled — 960 starting positions",          category: "classic",  difficulty: 2 },
  crazyhouse:    { id: "crazyhouse",    name: "Crazyhouse",       emoji: "🃏", tagline: "Captures return",   description: "Captured pieces become yours to drop on the board",           category: "wild",     difficulty: 2 },
  kingofthehill: { id: "kingofthehill", name: "King of the Hill", emoji: "👑", tagline: "Reach the center",  description: "March your king to e4, d4, e5, or d5 to win",                 category: "tactical", difficulty: 1 },
  fogofwar:      { id: "fogofwar",      name: "Fog of War",       emoji: "🌫️", tagline: "Hidden pieces",     description: "You only see squares your pieces can reach",                  category: "wild",     difficulty: 2 },
  puzzle:        { id: "puzzle",        name: "Puzzle Battles",   emoji: "🧩", tagline: "Solve to win",      description: "Find the best move in tactical positions",                    category: "training", difficulty: 2 },
  atomic:        { id: "atomic",        name: "Atomic",           emoji: "💥", tagline: "Captures explode",  description: "Captures detonate — surrounding pieces vanish. Blow up the king to win", category: "wild", difficulty: 3 },
  threecheck:    { id: "threecheck",    name: "Three-Check",      emoji: "⚡", tagline: "Three checks wins", description: "Deliver three checks to your opponent's king to claim victory",  category: "tactical", difficulty: 1 },
  horde:         { id: "horde",         name: "Horde",            emoji: "🐝", tagline: "36 pawns vs army",  description: "White commands a horde of 36 pawns. Black must capture them all",  category: "wild",   difficulty: 2 },
  antichess:     { id: "antichess",     name: "Antichess",        emoji: "🙃", tagline: "Lose to win",       description: "Captures are forced. First to lose all pieces (or stalemate) wins", category: "wild",   difficulty: 3 },
  racingkings:   { id: "racingkings",   name: "Racing Kings",     emoji: "🏁", tagline: "Race to rank 8",    description: "No checks allowed. First king to reach the eighth rank wins",      category: "tactical", difficulty: 2 },
};

export const VARIANT_CATEGORIES: Record<VariantCategory, { label: string; description: string }> = {
  classic:  { label: "Classic",  description: "Traditional rules with familiar positions" },
  tactical: { label: "Tactical", description: "Sharp objectives that reward calculation" },
  wild:     { label: "Wild",     description: "Bold rule twists for adventurous players" },
  training: { label: "Training", description: "Sharpen your skills with curated challenges" },
};

// ============= CHESS960 =============
// Generate a random Fischer Random starting position FEN
export function generateChess960Fen(): string {
  // Place pieces on back rank following 960 rules:
  // - Bishops on opposite colors
  // - King between the two rooks
  const positions: (string | null)[] = Array(8).fill(null);

  // Light bishop (odd index from white's perspective: 1,3,5,7)
  const lightSquares = [1, 3, 5, 7];
  positions[lightSquares[Math.floor(Math.random() * 4)]] = "b";
  // Dark bishop
  const darkSquares = [0, 2, 4, 6];
  positions[darkSquares[Math.floor(Math.random() * 4)]] = "b";

  const empty = () => positions.map((p, i) => (p === null ? i : -1)).filter(i => i >= 0);

  // Queen
  const e1 = empty();
  positions[e1[Math.floor(Math.random() * e1.length)]] = "q";
  // Knights
  const e2 = empty();
  positions[e2[Math.floor(Math.random() * e2.length)]] = "n";
  const e3 = empty();
  positions[e3[Math.floor(Math.random() * e3.length)]] = "n";
  // Remaining 3 squares: R K R
  const remaining = empty();
  positions[remaining[0]] = "r";
  positions[remaining[1]] = "k";
  positions[remaining[2]] = "r";

  const blackBack = positions.join("");
  const whiteBack = blackBack.toUpperCase();
  return `${blackBack}/pppppppp/8/8/8/8/PPPPPPPP/${whiteBack} w - - 0 1`;
}

// ============= KING OF THE HILL =============
const HILL_SQUARES: Square[] = ["d4", "d5", "e4", "e5"];

export function checkKingOfTheHill(game: Chess): { winner: Color | null } {
  for (const sq of HILL_SQUARES) {
    const piece = game.get(sq);
    if (piece && piece.type === "k") {
      return { winner: piece.color };
    }
  }
  return { winner: null };
}

export function getHillSquares(): Square[] {
  return [...HILL_SQUARES];
}

// ============= FOG OF WAR =============
// Returns set of squares visible to the given color (their pieces' squares + reachable squares)
export function getVisibleSquares(game: Chess, color: Color): Set<Square> {
  const visible = new Set<Square>();
  const board = game.board();
  const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r]?.[c];
      if (piece && piece.color === color) {
        const sq = `${FILES[c]}${RANKS[r]}` as Square;
        visible.add(sq);
        // Get reachable squares (sight lines)
        const sightSquares = getPieceSight(game, sq, piece.type, piece.color);
        sightSquares.forEach(s => visible.add(s));
      }
    }
  }
  return visible;
}

function getPieceSight(game: Chess, from: Square, type: PieceSymbol, color: Color): Square[] {
  // Use chess.js move generation by temporarily setting the turn
  // Simpler: compute manually based on piece type
  const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const RANKS = ["1", "2", "3", "4", "5", "6", "7", "8"];
  const file = FILES.indexOf(from[0]);
  const rank = RANKS.indexOf(from[1]);
  const result: Square[] = [];

  const inBounds = (f: number, r: number) => f >= 0 && f < 8 && r >= 0 && r < 8;
  const sqAt = (f: number, r: number) => `${FILES[f]}${RANKS[r]}` as Square;

  const slide = (df: number, dr: number) => {
    let f = file + df, r = rank + dr;
    while (inBounds(f, r)) {
      const s = sqAt(f, r);
      result.push(s);
      const p = game.get(s);
      if (p) break;
      f += df; r += dr;
    }
  };

  const step = (df: number, dr: number) => {
    const f = file + df, r = rank + dr;
    if (inBounds(f, r)) result.push(sqAt(f, r));
  };

  switch (type) {
    case "p": {
      const dir = color === "w" ? 1 : -1;
      // Pawns see diagonals (attacks) and forward
      [-1, 1].forEach(df => {
        const f = file + df, r = rank + dir;
        if (inBounds(f, r)) result.push(sqAt(f, r));
      });
      const f1 = file, r1 = rank + dir;
      if (inBounds(f1, r1)) result.push(sqAt(f1, r1));
      break;
    }
    case "n":
      [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]].forEach(([df, dr]) => step(df, dr));
      break;
    case "b":
      slide(1, 1); slide(1, -1); slide(-1, 1); slide(-1, -1);
      break;
    case "r":
      slide(1, 0); slide(-1, 0); slide(0, 1); slide(0, -1);
      break;
    case "q":
      slide(1, 0); slide(-1, 0); slide(0, 1); slide(0, -1);
      slide(1, 1); slide(1, -1); slide(-1, 1); slide(-1, -1);
      break;
    case "k":
      [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([df, dr]) => step(df, dr));
      break;
  }
  return result;
}

// ============= CRAZYHOUSE =============
export interface CrazyhousePocket {
  white: PieceSymbol[];
  black: PieceSymbol[];
}

export function emptyPocket(): CrazyhousePocket {
  return { white: [], black: [] };
}

export function addToPocket(pocket: CrazyhousePocket, color: Color, piece: PieceSymbol): CrazyhousePocket {
  // Captured piece goes to the OPPOSITE color's pocket (the capturer)
  const target = color === "w" ? "white" : "black";
  // Promoted pieces revert to pawns when captured
  const actual = (piece === "q" || piece === "r" || piece === "b" || piece === "n") ? piece : "p";
  return {
    ...pocket,
    [target]: [...pocket[target], actual === "p" ? "p" : actual],
  };
}

export function removeFromPocket(pocket: CrazyhousePocket, color: "white" | "black", piece: PieceSymbol): CrazyhousePocket {
  const idx = pocket[color].indexOf(piece);
  if (idx < 0) return pocket;
  const next = [...pocket[color]];
  next.splice(idx, 1);
  return { ...pocket, [color]: next };
}

export function canDropAt(game: Chess, square: Square, piece: PieceSymbol, color: Color): boolean {
  // Cannot drop on occupied square
  if (game.get(square)) return false;
  // Pawns cannot be dropped on rank 1 or 8
  if (piece === "p") {
    const rank = square[1];
    if (rank === "1" || rank === "8") return false;
  }
  return true;
}

// Drop a piece by injecting into FEN, returns new Chess instance or null if invalid
export function dropPiece(game: Chess, square: Square, piece: PieceSymbol, color: Color): Chess | null {
  if (!canDropAt(game, square, piece, color)) return null;
  const fen = game.fen();
  const parts = fen.split(" ");
  const rows = parts[0].split("/");
  const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];
  const fileIdx = FILES.indexOf(square[0]);
  const rankIdx = RANKS.indexOf(square[1]);

  // Expand row
  const row = rows[rankIdx];
  const expanded: string[] = [];
  for (const ch of row) {
    if (/\d/.test(ch)) {
      for (let i = 0; i < parseInt(ch); i++) expanded.push("");
    } else {
      expanded.push(ch);
    }
  }
  expanded[fileIdx] = color === "w" ? piece.toUpperCase() : piece.toLowerCase();

  // Re-compress
  let compressed = "";
  let count = 0;
  for (const ch of expanded) {
    if (ch === "") {
      count++;
    } else {
      if (count > 0) { compressed += count; count = 0; }
      compressed += ch;
    }
  }
  if (count > 0) compressed += count;

  rows[rankIdx] = compressed;
  parts[0] = rows.join("/");
  // Toggle turn
  parts[1] = color === "w" ? "b" : "w";
  // Reset en passant
  parts[3] = "-";
  // Increment fullmove if black just moved
  if (color === "b") parts[5] = String(parseInt(parts[5]) + 1);

  try {
    return new Chess(parts.join(" "));
  } catch {
    return null;
  }
}

// ============= PUZZLES =============
export interface ChessPuzzle {
  id: string;
  fen: string;
  solution: string[]; // SAN moves
  rating: number;
  theme: string;
  goal: string;
}

export const PUZZLES: ChessPuzzle[] = [
  {
    id: "p1",
    fen: "r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4",
    solution: ["Ke7"],
    rating: 800,
    theme: "Mate in 1 defense",
    goal: "Black to move — escape mate",
  },
  {
    id: "p2",
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 2 3",
    solution: ["Qxf7#"],
    rating: 600,
    theme: "Scholar's Mate",
    goal: "White to play — checkmate in 1",
  },
  {
    id: "p3",
    fen: "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1",
    solution: ["Ra8+"],
    rating: 700,
    theme: "Back rank",
    goal: "White to play — best move",
  },
  {
    id: "p4",
    fen: "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3",
    solution: ["Ke2"],
    rating: 500,
    theme: "King safety",
    goal: "White to play — only move",
  },
  {
    id: "p5",
    fen: "r4rk1/pp3ppp/2p5/2bp4/3Pn3/2N1P3/PP2BPPP/R1B2RK1 b - - 0 12",
    solution: ["Nxc3"],
    rating: 1200,
    theme: "Fork",
    goal: "Black to play — win material",
  },
  {
    id: "p6",
    fen: "r3k2r/ppp2ppp/2n1bn2/2bpp3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w kq - 0 7",
    solution: ["Nxe5"],
    rating: 1000,
    theme: "Capture",
    goal: "White to play — best move",
  },
];

export function getRandomPuzzle(): ChessPuzzle {
  return PUZZLES[Math.floor(Math.random() * PUZZLES.length)];
}

// ============= ATOMIC =============
const FILES_A = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS_A = ["1", "2", "3", "4", "5", "6", "7", "8"];

function neighbors(square: Square): Square[] {
  const f = FILES_A.indexOf(square[0]);
  const r = RANKS_A.indexOf(square[1]);
  const out: Square[] = [];
  for (let df = -1; df <= 1; df++) {
    for (let dr = -1; dr <= 1; dr++) {
      if (df === 0 && dr === 0) continue;
      const nf = f + df, nr = r + dr;
      if (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) {
        out.push(`${FILES_A[nf]}${RANKS_A[nr]}` as Square);
      }
    }
  }
  return out;
}

// Apply explosion to a chess.js board after a capture on `to`.
// Removes the capturing piece and all non-pawn pieces on the 8 surrounding squares.
export function applyAtomicExplosion(game: Chess, captureSquare: Square): Chess {
  game.remove(captureSquare);
  for (const sq of neighbors(captureSquare)) {
    const p = game.get(sq);
    if (p && p.type !== "p") game.remove(sq);
  }
  return new Chess(game.fen());
}

export function checkAtomicWinner(game: Chess): Color | null {
  const board = game.board();
  let whiteKing = false, blackKing = false;
  for (const row of board) for (const sq of row) {
    if (!sq) continue;
    if (sq.type === "k" && sq.color === "w") whiteKing = true;
    if (sq.type === "k" && sq.color === "b") blackKing = true;
  }
  if (!whiteKing) return "b";
  if (!blackKing) return "w";
  return null;
}

// ============= THREE-CHECK =============
export interface ThreeCheckState {
  whiteChecks: number;
  blackChecks: number;
}
export function emptyThreeCheck(): ThreeCheckState {
  return { whiteChecks: 0, blackChecks: 0 };
}
// Call after a move was made. The mover is the opposite of game.turn().
export function updateThreeCheck(state: ThreeCheckState, game: Chess): ThreeCheckState {
  if (!game.isCheck()) return state;
  const mover = game.turn() === "w" ? "b" : "w";
  return mover === "w"
    ? { ...state, whiteChecks: state.whiteChecks + 1 }
    : { ...state, blackChecks: state.blackChecks + 1 };
}
export function checkThreeCheckWinner(state: ThreeCheckState): Color | null {
  if (state.whiteChecks >= 3) return "w";
  if (state.blackChecks >= 3) return "b";
  return null;
}

// ============= HORDE =============
export function generateHordeFen(): string {
  return "rnbqkbnr/pppppppp/8/1PP2PP1/PPPPPPPP/PPPPPPPP/PPPPPPPP/PPPPPPPP w kq - 0 1";
}
export function checkHordeWinner(game: Chess): Color | null {
  let whitePieces = 0;
  for (const row of game.board()) for (const sq of row) {
    if (sq && sq.color === "w") whitePieces++;
  }
  if (whitePieces === 0) return "b";
  if (game.isCheckmate()) return game.turn() === "w" ? "b" : "w";
  return null;
}

// ============= ANTICHESS =============
export function getForcedCaptures(game: Chess): { from: Square; to: Square }[] {
  const moves = game.moves({ verbose: true });
  return moves.filter(m => m.captured).map(m => ({ from: m.from as Square, to: m.to as Square }));
}
export function checkAntichessWinner(game: Chess): Color | null {
  const board = game.board();
  let whiteCount = 0, blackCount = 0;
  for (const row of board) for (const sq of row) {
    if (!sq) continue;
    if (sq.color === "w") whiteCount++; else blackCount++;
  }
  if (whiteCount === 0) return "w";
  if (blackCount === 0) return "b";
  if (game.moves().length === 0) return game.turn();
  return null;
}

// ============= RACING KINGS =============
export function generateRacingKingsFen(): string {
  return "8/8/8/8/8/8/krbnNBRK/qrbnNBRQ w - - 0 1";
}
export function checkRacingKingsWinner(game: Chess): Color | null {
  const board = game.board();
  let whiteKingRank = -1, blackKingRank = -1;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const sq = board[r]?.[c];
      if (sq && sq.type === "k") {
        const rank = 8 - r;
        if (sq.color === "w") whiteKingRank = rank;
        else blackKingRank = rank;
      }
    }
  }
  if (whiteKingRank === 8) return "w";
  if (blackKingRank === 8) return "b";
  return null;
}
