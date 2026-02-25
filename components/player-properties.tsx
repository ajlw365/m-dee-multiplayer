"use client";

import { cn } from "@/lib/utils";
import type { PropertySet, PropertyCard, CardColor } from "@/lib/game-types";
import { CheckCircle2, Layers, Landmark, Check } from "lucide-react";

const colorClasses: Record<CardColor, { banner: string }> = {
  darkblue: { banner: "bg-card-darkblue-banner" },
  lightblue: { banner: "bg-card-lightblue-banner" },
  brown: { banner: "bg-card-brown-banner" },
  green: { banner: "bg-card-green-banner" },
  utility: { banner: "bg-card-utility-banner" },
  red: { banner: "bg-card-red-banner" },
  yellow: { banner: "bg-[var(--card-yellow)]" },
  orange: { banner: "bg-card-orange-banner" },
  pink: { banner: "bg-card-pink-banner" },
  railroad: { banner: "bg-card-railroad-banner" },
  purple: { banner: "bg-card-purple-banner" },
  all: { banner: "bg-muted" },
};

const RAINBOW_GRADIENT = "bg-[linear-gradient(135deg,oklch(0.58_0.24_25)_0%,oklch(0.75_0.18_60)_20%,oklch(0.65_0.20_130)_40%,oklch(0.50_0.20_200)_60%,oklch(0.45_0.22_280)_80%,oklch(0.60_0.22_330)_100%)]";

function isRainbowWild(cardName: string): boolean {
  const n = cardName.toUpperCase();
  return n.includes("MULTI");
}

function isWildcardName(cardName: string): boolean {
  const n = cardName.toUpperCase();
  if (n.includes("HOUSE") || n.includes("HOTEL")) return false;
  return n.includes("WILDCARD") || n.includes("WILD");
}

function sortedCards(cards: PropertyCard[]): PropertyCard[] {
  return [...cards].sort((a, b) => {
    const aWild = isWildcardName(a.name);
    const bWild = isWildcardName(b.name);
    if (aWild && !bWild) return 1;
    if (!aWild && bWild) return -1;
    return 0;
  });
}

function getSecondWildColor(cardName: string, setColor: CardColor): string {
  const n = cardName.toUpperCase();
  const colorPairs: Record<string, [string, string]> = {
    "DARK BLUE/GREEN": ["darkblue", "green"],
    "GREEN/DARK BLUE": ["green", "darkblue"],
    "GREEN/RAILROAD": ["green", "railroad"],
    "RAILROAD/GREEN": ["railroad", "green"],
    "LIGHT BLUE/RAILROAD": ["lightblue", "railroad"],
    "RAILROAD/LIGHT BLUE": ["railroad", "lightblue"],
    "LIGHT BLUE/BROWN": ["lightblue", "brown"],
    "BROWN/LIGHT BLUE": ["brown", "lightblue"],
    "RED/YELLOW": ["red", "yellow"],
    "YELLOW/RED": ["yellow", "red"],
    "PINK/ORANGE": ["pink", "orange"],
    "ORANGE/PINK": ["orange", "pink"],
    "RAILROAD/UTILITY": ["railroad", "utility"],
    "UTILITY/RAILROAD": ["utility", "railroad"],
  };
  for (const [key, [c1, c2]] of Object.entries(colorPairs)) {
    if (n.includes(key)) {
      const otherColor = (setColor === c1 ? c2 : c1) as CardColor;
      return colorClasses[otherColor]?.banner ?? "bg-muted";
    }
  }
  return "bg-muted";
}

const STACK_OFFSET = 20;

function getCurrentRent(set: PropertySet): number {
  const count = set.cards.length;
  if (count === 0) return 0;
  const cardWithRent = set.cards.find(
    (c) => c.rentTable && c.rentTable.length > 0,
  );
  if (!cardWithRent) return 0;
  const entry = cardWithRent.rentTable.find((r) => r.cards === count);
  if (entry) return entry.rent;
  const lower = [...cardWithRent.rentTable]
    .reverse()
    .find((r) => r.cards <= count);
  return lower?.rent ?? 0;
}

interface PlayerPropertiesProps {
  propertySets: PropertySet[];
  bankTotal: number;
}

export function PlayerProperties({
  propertySets,
  bankTotal,
}: PlayerPropertiesProps) {
  const completeSets = propertySets.filter((s) => s.isComplete).length;

  if (propertySets.length === 0) {
    return (
      <section
        className="border-t border-border-dim bg-card-subtle px-4 py-3"
        aria-label="Your properties"
      >
        <div className="flex items-center gap-2">
          <Layers
            className="h-3.5 w-3.5 text-muted-foreground"
            aria-hidden="true"
          />
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Your Properties
          </h2>
          <span className="text-[11px] text-muted-foreground">0 sets</span>
          <div className="ml-auto flex items-center gap-2 rounded-lg bg-secondary px-2 py-2">
            <Landmark className="h-3 w-3 text-foreground" aria-hidden="true" />
            <span className="text-[10px] font-bold text-card-green">
              {"$"}
              {bankTotal}M
            </span>
          </div>
        </div>
        <p className="text-[10px] text-text-dim mt-1">
          No property sets yet. Play property cards from your hand.
        </p>
      </section>
    );
  }

  return (
    <section
      className="border-t border-border-dim bg-card-subtle px-4 py-3"
      aria-label="Your properties"
    >
      {/* Header: title + sets count + bank balance */}
      <div className="flex items-center gap-2 mb-2.5">
        <Layers
          className="h-3.5 w-3.5 text-muted-foreground"
          aria-hidden="true"
        />
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Your Properties
        </h2>
        <span className="text-[9px] text-muted-foreground">
          {completeSets} set{completeSets !== 1 ? "s" : ""}
        </span>
        <div className="ml-auto flex items-center gap-1 rounded-lg bg-secondary px-2 py-1">
          <Landmark className="h-3 w-3 text-foreground" aria-hidden="true" />
          <span className="text-[10px] font-bold text-card-green">
            {"$"}
            {bankTotal}M
          </span>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {propertySets.map((set, si) => {
          const c = colorClasses[set.color];
          const cardH = 52;
          const totalH = cardH + (set.cards.length - 1) * STACK_OFFSET;
          const currentRent = getCurrentRent(set);
          return (
            <div
              key={`${set.color}-${si}`}
              className="flex-shrink-0 rounded-xl border-2 border-border bg-card p-2.5 min-w-[90px]"
            >
              {/* Current rent + completion status as ratio or checkmark */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-bold text-foreground">
                    ${currentRent}M
                  </span>
                  <span className="text-[8px] text-muted-foreground">rent</span>
                </div>
                <div className="flex items-center gap-1">
                  {set.isComplete ? (
                    <Check className="h-3 w-3 text-primary" strokeWidth={3} />
                  ) : (
                    <span className="text-[8px] font-bold text-muted-foreground">
                      {set.cards.length}/{set.requiredCount}
                    </span>
                  )}
                </div>
              </div>

              {/* Solitaire stacked mini cards -- wildcards at front */}
              <div className="relative" style={{ height: totalH }}>
                {sortedCards(set.cards).map((card, ci) => {
                  const isWild = isWildcardName(card.name);
                  const isTwoColorWild = isWild && !isRainbowWild(card.name);
                  return (
                    <div
                      key={card.id}
                      className="absolute left-0 right-0 rounded-lg border-[1.5px] border-[oklch(0.20_0.01_260)] overflow-hidden"
                      style={{
                        top: ci * STACK_OFFSET,
                        zIndex: ci,
                        height: cardH,
                      }}
                    >
                      {isTwoColorWild ? (
                        <div className="flex flex-col h-full">
                          <div className={cn("flex-1 flex items-center justify-center", c?.banner ?? "bg-muted")} />
                          <div className="h-[3px] bg-white flex-shrink-0" />
                          <div className={cn("flex-1 flex items-center justify-center relative", getSecondWildColor(card.name, set.color))}>
                            <span className="text-[5px] font-bold text-white truncate absolute bottom-0.5">WILD</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div
                            className={cn(
                              "h-3.5 relative flex items-center justify-center px-1.5",
                              isRainbowWild(card.name) ? RAINBOW_GRADIENT : (c?.banner ?? "bg-muted"),
                            )}
                          >
                            <span className="text-[5px] font-bold text-white truncate text-center">
                              {card.name}
                            </span>
                          </div>
                          <div className="bg-white px-1.5 py-0.5">
                            <span className="text-[7px] font-black text-[oklch(0.15_0.01_260)] uppercase leading-tight">
                              {card.name}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
