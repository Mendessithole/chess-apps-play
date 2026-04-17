import { createFileRoute, useNavigate } from "@tanstack/react-router";
import chessBgPattern from "@/assets/chess-bg-pattern.jpg";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlayModeCard } from "@/components/chess/PlayModeCard";
import { SpeedSelector } from "@/components/chess/SpeedSelector";
import { type GameSpeed, type AIDifficulty, AI_LEVELS } from "@/lib/chess-engine";
import { VARIANTS, type VariantId } from "@/lib/chess-variants";
import { Bot, Globe, Trophy, Swords, Users, Crown } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Chess with AI — Play Chess Online" },
      { name: "description", content: "Play chess against AI opponents. Bullet, Blitz, Rapid & Daily modes." },
      { property: "og:title", content: "Chess with AI — Play Chess Online" },
      { property: "og:description", content: "Play chess against AI with multiple difficulty levels and game modes." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const [speed, setSpeed] = useState<GameSpeed>("blitz");
  const [difficulty, setDifficulty] = useState<AIDifficulty>("intermediate");

  const startGame = (color: "white" | "black" | "random", variant: VariantId = "standard") => {
    const finalColor = color === "random" ? (Math.random() > 0.5 ? "white" : "black") : color;
    navigate({
      to: "/play",
      search: { speed, difficulty, color: finalColor, variant },
    });
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Chess pattern background */}
      <div className="fixed inset-0 z-0 opacity-15" style={{ backgroundImage: `url(${chessBgPattern})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div className="relative z-10">
      {/* Header */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-primary" />
            <span className="font-heading font-bold text-lg text-foreground">Chess with AI</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">ELO: 1200</span>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">P</div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <section className="text-center space-y-3 animate-slide-up">
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-foreground tracking-tight">
            <span className="text-primary">Chess</span> with AI
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Challenge AI bots, compete online, and climb the ranks
          </p>
        </section>

        {/* Speed Selector */}
        <section className="max-w-lg mx-auto animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <h2 className="font-heading text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 text-center">
            Time Control
          </h2>
          <SpeedSelector selected={speed} onSelect={setSpeed} />
        </section>

        {/* Play Modes */}
        <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <h2 className="font-heading text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Play Modes
          </h2>

          {/* Play vs AI card */}
          <PlayModeCard
            icon={<Bot className="w-6 h-6 text-primary" />}
            title="Play vs AI"
            description="Practice against bots with adjustable difficulty"
            onClick={() => {}}
            variant="featured"
          />

          {/* AI Setup - always visible below Play vs AI */}
          <div className="bg-surface border border-border rounded-xl p-5 mt-3 mb-4 space-y-4">
            <div>
              <h3 className="font-heading text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Difficulty</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.entries(AI_LEVELS) as [AIDifficulty, typeof AI_LEVELS[AIDifficulty]][]).map(([key, level]) => (
                  <button
                    key={key}
                    onClick={() => setDifficulty(key)}
                    className={`text-left p-3 rounded-lg border transition-all ${
                      difficulty === key
                        ? "bg-primary/15 border-primary text-foreground"
                        : "bg-background border-border text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    <p className="font-heading text-sm font-semibold">{level.label}</p>
                    <p className="text-[11px] opacity-70">{level.elo}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-heading text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Play as</h3>
              <div className="flex gap-2">
                <Button onClick={() => startGame("white")} className="flex-1" variant="outline">♔ White</Button>
                <Button onClick={() => startGame("random")} className="flex-1" variant="default">🎲 Random</Button>
                <Button onClick={() => startGame("black")} className="flex-1" variant="outline">♚ Black</Button>
              </div>
            </div>

            <Button onClick={() => startGame("random")} className="w-full" size="lg">
              ⚔️ Start Game
            </Button>
          </div>

          {/* Other modes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <PlayModeCard
              icon={<Globe className="w-6 h-6 text-foreground" />}
              title="Online Match"
              description="Find an opponent for a rated game"
              badge="Coming Soon"
              onClick={() => {}}
            />
            <PlayModeCard
              icon={<Swords className="w-6 h-6 text-foreground" />}
              title="Odds Chess"
              description="Handicap mode for balanced training"
              badge="Coming Soon"
              onClick={() => {}}
            />
            <PlayModeCard
              icon={<Users className="w-6 h-6 text-foreground" />}
              title="Simultaneous"
              description="Play multiple games at once"
              badge="Coming Soon"
              onClick={() => {}}
            />
          </div>
        </section>

        {/* Rankings Preview */}
        <section className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <h2 className="font-heading text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-gold" /> Leaderboard
          </h2>
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            {[
              { rank: 1, name: "GrandMaster99", elo: 2450, wins: 342 },
              { rank: 2, name: "TacticalGenius", elo: 2380, wins: 298 },
              { rank: 3, name: "ChessWizard", elo: 2310, wins: 276 },
              { rank: 4, name: "StrategyKing", elo: 2280, wins: 251 },
              { rank: 5, name: "KnightRider", elo: 2240, wins: 223 },
            ].map((player) => (
              <div key={player.rank} className="flex items-center px-4 py-3 border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                <span className={`w-8 font-heading font-bold text-sm ${player.rank <= 3 ? "text-gold" : "text-muted-foreground"}`}>
                  #{player.rank}
                </span>
                <span className="flex-1 font-medium text-sm text-foreground">{player.name}</span>
                <span className="text-sm text-primary font-heading font-semibold w-16 text-right">{player.elo}</span>
                <span className="text-xs text-muted-foreground w-20 text-right">{player.wins} wins</span>
              </div>
            ))}
          </div>
        </section>
      </main>
      </div>
    </div>
  );
}
