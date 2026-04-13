import React from "react";
import { cn } from "@/lib/utils";
import { SPEED_CONFIGS, type GameSpeed } from "@/lib/chess-engine";

interface SpeedSelectorProps {
  selected: GameSpeed;
  onSelect: (speed: GameSpeed) => void;
}

export function SpeedSelector({ selected, onSelect }: SpeedSelectorProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {(Object.entries(SPEED_CONFIGS) as [GameSpeed, typeof SPEED_CONFIGS[GameSpeed]][]).map(([key, config]) => (
        <button
          key={key}
          onClick={() => onSelect(key)}
          className={cn(
            "flex flex-col items-center gap-1 rounded-lg p-3 transition-all duration-200 border",
            selected === key
              ? "bg-primary/15 border-primary text-foreground shadow-sm shadow-primary/20"
              : "bg-surface border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
          )}
        >
          <span className="text-xl">{config.icon}</span>
          <span className="font-heading text-xs font-semibold">{config.label}</span>
          <span className="text-[10px] opacity-70">{config.time}</span>
        </button>
      ))}
    </div>
  );
}
