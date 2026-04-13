import React from "react";
import { cn } from "@/lib/utils";

interface PlayModeCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  onClick: () => void;
  variant?: "default" | "featured";
}

export function PlayModeCard({ icon, title, description, badge, onClick, variant = "default" }: PlayModeCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-start gap-3 rounded-xl p-5 text-left transition-all duration-300",
        "border border-border hover:border-primary/50",
        "hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5",
        variant === "featured"
          ? "bg-gradient-to-br from-primary/15 to-primary/5 border-primary/30"
          : "bg-surface"
      )}
    >
      {badge && (
        <span className="absolute top-3 right-3 bg-gold text-gold-foreground text-[10px] font-heading font-bold uppercase px-2 py-0.5 rounded-full tracking-wider">
          {badge}
        </span>
      )}
      <div className={cn(
        "flex items-center justify-center w-12 h-12 rounded-lg text-2xl transition-transform group-hover:scale-110",
        variant === "featured" ? "bg-primary/20" : "bg-accent"
      )}>
        {icon}
      </div>
      <div>
        <h3 className="font-heading font-semibold text-foreground text-base">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
      </div>
    </button>
  );
}
