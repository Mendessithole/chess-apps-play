import { createFileRoute, useNavigate } from "@tanstack/react-router";
import chessBgPattern from "@/assets/chess-bg-pattern.jpg";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlayModeCard } from "@/components/chess/PlayModeCard";
import { SpeedSelector } from "@/components/chess/SpeedSelector";
import { type GameSpeed, type AIDifficulty, AI_LEVELS } from "@/lib/chess-engine";
import { VARIANTS, VARIANT_CATEGORIES, type VariantId, type VariantCategory } from "@/lib/chess-variants";
import { Bot, Globe, Trophy, Swords, Users, Crown, Sparkles, Target, Flame, ArrowRight } from "lucide-react";

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
  const [variantTab, setVariantTab] = useState<VariantCategory | "all">("all");

  const startGame = (color: "white" | "black" | "random", variant: VariantId = "standard") => {
    const finalColor = color === "random" ? (Math.random() > 0.5 ? "white" : "black") : color;
    navigate({
      to: "/play",
      search: { speed, difficulty, color: finalColor, variant },
    });
  };

  const allVariants = Object.values(VARIANTS).filter(v => v.id !== "standard");
  const filteredVariants = variantTab === "all"
    ? allVariants
    : allVariants.filter(v => v.category === variantTab);
  const tabKeys: (VariantCategory | "all")[] = ["all", "tactical", "wild", "training", "classic"];

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

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* Hero */}
        <section className="text-center space-y-4 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-heading font-semibold text-primary uppercase tracking-wider">
            <Sparkles className="w-3 h-3" /> 11 Game Modes · Play Offline
          </div>
          <h1 className="font-heading text-4xl sm:text-6xl font-bold text-foreground tracking-tight">
            <span className="bg-gradient-to-r from-primary via-primary/80 to-gold bg-clip-text text-transparent">Chess</span> with AI
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base">
            Challenge AI bots, master variants, solve puzzles, and climb the global ranks
          </p>
          <div className="flex items-center justify-center gap-6 sm:gap-10 pt-2 text-xs">
            <div className="flex flex-col items-center gap-0.5">
              <span className="font-heading text-xl font-bold text-foreground">11</span>
              <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Variants</span>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex flex-col items-center gap-0.5">
              <span className="font-heading text-xl font-bold text-foreground">4</span>
              <span className="text-muted-foreground uppercase tracking-wider text-[10px]">AI Levels</span>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex flex-col items-center gap-0.5">
              <span className="font-heading text-xl font-bold text-foreground">∞</span>
              <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Games</span>
            </div>
          </div>
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

        {/* Chess Variants */}
        <section className="animate-slide-up" style={{ animationDelay: "0.25s" }}>
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <div>
              <h2 className="font-heading text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Flame className="w-4 h-4 text-primary" /> Chess Variants
              </h2>
              <p className="text-xs text-muted-foreground/70 mt-1">10 fully playable game modes — pick your battlefield</p>
            </div>
            <div className="flex flex-wrap gap-1.5 bg-surface border border-border rounded-lg p-1">
              {tabKeys.map((key) => {
                const label = key === "all" ? "All" : VARIANT_CATEGORIES[key as VariantCategory].label;
                const active = variantTab === key;
                return (
                  <button
                    key={key}
                    onClick={() => setVariantTab(key)}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-heading font-semibold uppercase tracking-wider transition-all ${
                      active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredVariants.map((v) => {
              const catColor =
                v.category === "tactical" ? "text-chart-2 bg-chart-2/10" :
                v.category === "wild"     ? "text-destructive bg-destructive/10" :
                v.category === "training" ? "text-gold bg-gold/10" :
                                            "text-primary bg-primary/10";
              return (
                <button
                  key={v.id}
                  onClick={() => startGame("random", v.id)}
                  className="group relative flex flex-col gap-3 rounded-xl p-4 text-left transition-all duration-300 border border-border bg-surface hover:border-primary/60 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-0.5 overflow-hidden"
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
                  <div className="relative flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-background to-accent/40 border border-border flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        {v.emoji}
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-foreground text-[15px] leading-tight">{v.name}</h3>
                        <p className="text-[10px] text-primary uppercase tracking-wider font-semibold mt-0.5">{v.tagline}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-heading font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${catColor}`}>
                      {VARIANT_CATEGORIES[v.category].label}
                    </span>
                  </div>
                  <p className="relative text-xs text-muted-foreground leading-relaxed line-clamp-2 min-h-[2.5em]">{v.description}</p>
                  <div className="relative flex items-center justify-between pt-1 border-t border-border/50">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Skill</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3].map(i => (
                          <span key={i} className={`w-1.5 h-1.5 rounded-full ${i <= v.difficulty ? "bg-primary" : "bg-border"}`} />
                        ))}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] text-primary font-heading font-bold group-hover:gap-2 transition-all">
                      Play <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Daily Challenge */}
        <section className="animate-slide-up" style={{ animationDelay: "0.28s" }}>
          <button
            onClick={() => startGame("random", "puzzle")}
            className="w-full group relative overflow-hidden rounded-xl border border-gold/30 bg-gradient-to-r from-surface via-surface to-gold/5 p-5 flex items-center gap-4 text-left hover:border-gold/60 transition-all"
          >
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-gold/10 blur-3xl group-hover:bg-gold/20 transition-all" />
            <div className="relative w-12 h-12 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center">
              <Target className="w-6 h-6 text-gold" />
            </div>
            <div className="relative flex-1">
              <p className="text-[10px] font-heading font-bold text-gold uppercase tracking-wider">Daily Challenge</p>
              <h3 className="font-heading font-bold text-foreground text-base">Solve today's puzzle</h3>
              <p className="text-xs text-muted-foreground">Sharpen your tactics — random puzzle, unlimited attempts</p>
            </div>
            <ArrowRight className="relative w-5 h-5 text-gold group-hover:translate-x-1 transition-transform" />
          </button>
        </section>

        {/* Rankings Preview */}
        <section className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <h2 className="font-heading text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-gold" /> Leaderboard
          </h2>
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            {[
              { rank: 1, name: "GrandMaster99",  elo: 2450, wins: 342, country: "🇺🇸" },
              { rank: 2, name: "TacticalGenius", elo: 2380, wins: 298, country: "🇮🇳" },
              { rank: 3, name: "ChessWizard",    elo: 2310, wins: 276, country: "🇷🇺" },
              { rank: 4, name: "StrategyKing",   elo: 2280, wins: 251, country: "🇩🇪" },
              { rank: 5, name: "KnightRider",    elo: 2240, wins: 223, country: "🇧🇷" },
            ].map((player) => {
              const medal = player.rank === 1 ? "🥇" : player.rank === 2 ? "🥈" : player.rank === 3 ? "🥉" : null;
              return (
                <div key={player.rank} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                  <span className={`w-8 font-heading font-bold text-sm ${player.rank <= 3 ? "text-gold" : "text-muted-foreground"}`}>
                    {medal ?? `#${player.rank}`}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-border flex items-center justify-center text-xs font-heading font-bold text-foreground">
                    {player.name.slice(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm text-foreground truncate">{player.name}</span>
                      <span className="text-sm">{player.country}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{player.wins} wins</span>
                  </div>
                  <span className="text-sm text-primary font-heading font-bold tabular-nums">{player.elo}</span>
                </div>
              );
            })}
            <div className="px-4 py-2.5 bg-background/50 text-center">
              <span className="text-[11px] text-muted-foreground">Global rankings update daily</span>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-[11px] text-muted-foreground/60 pt-6 pb-2 border-t border-border">
          <p>Chess with AI · Built for offline play · {new Date().getFullYear()}</p>
        </footer>
      </main>
      </div>
    </div>
  );
}
