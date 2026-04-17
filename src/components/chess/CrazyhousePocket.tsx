import React from "react";
import { type PieceSymbol } from "chess.js";
import { ChessPiece } from "./ChessPieces";
import { type CrazyhousePocket as Pocket } from "@/lib/chess-variants";
import { cn } from "@/lib/utils";

interface Props {
  pocket: Pocket;
  color: "white" | "black";
  selectedDrop: PieceSymbol | null;
  onSelectDrop: (piece: PieceSymbol | null) => void;
  disabled?: boolean;
  label: string;
}

export function CrazyhousePocketBar({ pocket, color, selectedDrop, onSelectDrop, disabled, label }: Props) {
  const pieces = pocket[color];
  const counts: Partial<Record<PieceSymbol, number>> = {};
  pieces.forEach(p => { counts[p] = (counts[p] || 0) + 1; });
  const order: PieceSymbol[] = ["q", "r", "b", "n", "p"];

  return (
    <div className="flex items-center gap-2 bg-surface rounded-lg px-3 py-2 border border-border">
      <span className="text-[10px] font-heading font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="flex gap-1 flex-1">
        {order.map(p => {
          const count = counts[p] || 0;
          if (count === 0) return null;
          const isSelected = selectedDrop === p;
          return (
            <button
              key={p}
              disabled={disabled}
              onClick={() => onSelectDrop(isSelected ? null : p)}
              className={cn(
                "relative flex items-center justify-center rounded-md transition-all w-9 h-9",
                isSelected ? "bg-primary/30 ring-2 ring-primary" : "bg-background hover:bg-accent",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <ChessPiece type={p} color={color} size={28} />
              {count > 1 && (
                <span className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
          );
        })}
        {pieces.length === 0 && (
          <span className="text-xs text-muted-foreground italic">empty</span>
        )}
      </div>
    </div>
  );
}
