"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { Player, CardColor, PropertySet } from "@/lib/game-types"
import { Landmark, Eye, X, Check, Users } from "lucide-react"

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
  all: { banner: "bg-card-utility-banner" },
}

const RAINBOW_GRADIENT = "bg-[linear-gradient(135deg,oklch(0.58_0.24_25)_0%,oklch(0.75_0.18_60)_20%,oklch(0.65_0.20_130)_40%,oklch(0.50_0.20_200)_60%,oklch(0.45_0.22_280)_80%,oklch(0.60_0.22_330)_100%)]"

function isRainbowWild(cardName: string): boolean {
  const n = cardName.toUpperCase()
  return n.includes("MULTI")
}

function isWildcardName(cardName: string): boolean {
  const n = cardName.toUpperCase()
  if (n.includes("HOUSE") || n.includes("HOTEL")) return false
  return n.includes("WILDCARD") || n.includes("WILD")
}

function sortedCards(cards: import("@/lib/game-types").PropertyCard[]): import("@/lib/game-types").PropertyCard[] {
  return [...cards].sort((a, b) => {
    const aWild = isWildcardName(a.name)
    const bWild = isWildcardName(b.name)
    if (aWild && !bWild) return 1
    if (!aWild && bWild) return -1
    return 0
  })
}

function getSecondWildColor(cardName: string, setColor: CardColor): string {
  const n = cardName.toUpperCase()
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
  }
  for (const [key, [c1, c2]] of Object.entries(colorPairs)) {
    if (n.includes(key)) {
      const otherColor = (setColor === c1 ? c2 : c1) as CardColor
      return colorClasses[otherColor]?.banner ?? "bg-muted"
    }
  }
  return "bg-muted"
}

const STACK_OFFSET = 20

function getCurrentRent(set: PropertySet): number {
  const count = set.cards.length
  if (count === 0) return 0
  const topCard = set.cards[0]
  const entry = topCard.rentTable.find((r) => r.cards === count)
  if (entry) return entry.rent
  const lower = [...topCard.rentTable].reverse().find((r) => r.cards <= count)
  return lower?.rent ?? 0
}

function getCompleteSets(player: Player): number {
  return player.propertySets.filter((s) => s.isComplete).length
}

/* Mini stack for opponent inline view -- shows ratio or checkmark */
function MiniStack({ set }: { set: PropertySet }) {
  const c = colorClasses[set.color]
  const sorted = sortedCards(set.cards)
  const cardH = 38
  const totalH = cardH + (sorted.length - 1) * STACK_OFFSET
  return (
    <div className="relative flex-shrink-0" style={{ width: 30, height: totalH }}>
      {sorted.map((card, i) => {
        const isWild = isWildcardName(card.name)
        const isTwoColorWild = isWild && !isRainbowWild(card.name)
        const isLast = i === sorted.length - 1
        return (
          <div
            key={card.id}
            className="absolute left-0 w-[30px] rounded-md border-[1.5px] border-[oklch(0.20_0.01_260)] overflow-hidden"
            style={{ top: i * STACK_OFFSET, zIndex: i, height: cardH }}
          >
            {isTwoColorWild ? (
              <div className="flex flex-col h-full">
                <div className={cn("flex-[2]", c.banner)} />
                <div className="h-[2px] bg-white flex-shrink-0" />
                <div className={cn("flex-[2] flex items-center justify-center", getSecondWildColor(card.name, set.color))}>
                  {isLast && (
                    set.isComplete ? (
                      <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                    ) : (
                      <span className="text-[6px] font-black text-white">
                        {sorted.length}/{set.requiredCount}
                      </span>
                    )
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className={cn("h-2.5 w-full", isRainbowWild(card.name) ? RAINBOW_GRADIENT : c.banner)} />
                <div className="flex-1 bg-white flex items-center justify-center" style={{ height: cardH - 10 }}>
                  {isLast && (
                    set.isComplete ? (
                      <Check className="h-3 w-3 text-primary" strokeWidth={3} />
                    ) : (
                      <span className="text-[7px] font-black text-[oklch(0.25_0.01_260)]">
                        {sorted.length}/{set.requiredCount}
                      </span>
                    )
                  )}
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ---- Overlay: condensed card style matching PlayerProperties, with ratio/checkmark ---- */
function PropertyOverlay({ player, onClose }: { player: Player; onClose: () => void }) {
  const completeSets = getCompleteSets(player)

  return (
    <>
      <div className="fixed inset-0 z-40 bg-background" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-x-4 top-16 bottom-16 z-50 flex flex-col rounded-3xl border-2 border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-subtle text-sm font-bold text-primary">
              {player.avatar}
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">{player.name}{"'s"} Properties</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex items-center gap-1">
                  <Landmark className="h-3 w-3 text-foreground" aria-hidden="true" />
                  <span className="text-[10px] font-bold text-card-green">{"$"}{player.bankTotal}M</span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {completeSets} set{completeSets !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-3d btn-3d-ghost flex h-8 w-8 items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:text-foreground"
            aria-label="Close overlay"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Condensed property cards */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {player.propertySets.length === 0 ? (
            <p className="text-center text-sm text-text-dim py-8">No properties yet</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {player.propertySets.map((set, si) => {
                const c = colorClasses[set.color]
                const cardH = 52
                const totalH = cardH + (set.cards.length - 1) * STACK_OFFSET
                const currentRent = getCurrentRent(set)
                return (
                  <div
                    key={`${set.color}-${si}`}
                    className="flex-shrink-0 rounded-xl border-2 border-border bg-card p-2.5 min-w-[90px]"
                  >
                    {/* Rent + completion */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-bold text-foreground">${currentRent}M</span>
                        <span className="text-[9px] text-muted-foreground">rent</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {set.isComplete ? (
                          <Check className="h-3 w-3 text-primary" strokeWidth={3} />
                        ) : (
                          <span className="text-[8px] font-bold text-muted-foreground">{set.cards.length}/{set.requiredCount}</span>
                        )}
                      </div>
                    </div>

                    {/* Solitaire stacked mini cards -- wildcards at bottom */}
                    <div className="relative" style={{ height: totalH }}>
                      {sortedCards(set.cards).map((card, ci) => {
                        const isWild = isWildcardName(card.name)
                        const isTwoColorWild = isWild && !isRainbowWild(card.name)
                        return (
                          <div
                            key={card.id}
                            className="absolute left-0 right-0 rounded-lg border-[1.5px] border-[oklch(0.20_0.01_260)] overflow-hidden"
                            style={{ top: ci * STACK_OFFSET, zIndex: ci, height: cardH }}
                          >
                            {isTwoColorWild ? (
                              <div className="flex flex-col h-full">
                                <div className={cn("flex-[2] flex items-center justify-center", c?.banner ?? "bg-muted")} />
                                <div className="h-[3px] bg-white flex-shrink-0" />
                                <div className={cn("flex-[2] flex items-center justify-center relative", getSecondWildColor(card.name, set.color))}>
                                  <span className="text-[5px] font-bold text-white truncate absolute bottom-0.5">WILD</span>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className={cn("h-3.5 relative flex items-center justify-center px-1.5", isRainbowWild(card.name) ? RAINBOW_GRADIENT : (c?.banner ?? "bg-muted"))}>
                                  <span className="text-[5px] font-bold text-white truncate text-center">{card.name}</span>
                                </div>
                                <div className="bg-white px-1.5 py-0.5">
                                  <span className="text-[7px] font-black text-[oklch(0.15_0.01_260)] uppercase leading-tight">{card.name}</span>
                                </div>
                              </>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

interface OpponentAreaProps {
  opponents: Player[]
  currentTurnPlayerId: string
}

export function OpponentArea({ opponents, currentTurnPlayerId }: OpponentAreaProps) {
  const [inspecting, setInspecting] = useState<Player | null>(null)

  return (
    <>
      <section aria-label="Opponents">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-1">
          <Users className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Your Opponents
          </h2>
        </div>

        {/* Opponents list */}
        <div className="px-3 py-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {opponents.map((opp) => {
              const isCurrentTurn = opp.id === currentTurnPlayerId
              const completeSets = getCompleteSets(opp)
              return (
                <div
                  key={opp.id}
                  className={cn(
                    "flex-shrink-0 flex flex-col rounded-2xl border-2 bg-card p-3 min-w-[150px] max-w-[170px] transition-all",
                    isCurrentTurn ? "border-primary bg-primary-subtle" : "border-border"
                  )}
                >
                  {/* Name row with sets count */}
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0",
                        isCurrentTurn ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                      )}
                    >
                      {opp.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-foreground truncate">{opp.name}</p>
                        <span className="text-[9px] text-muted-foreground shrink-0">
                          {completeSets} set{completeSets !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {isCurrentTurn && <p className="text-[9px] font-medium text-primary">Playing...</p>}
                    </div>
                  </div>

                  {/* Solitaire-stacked property sets */}
                  <div className="flex items-end gap-2 flex-1 min-h-[40px] overflow-x-auto scrollbar-hide">
                    {opp.propertySets.length > 0 ? (
                      opp.propertySets.map((set, i) => (
                        <MiniStack key={`${opp.id}-${set.color}-${i}`} set={set} />
                      ))
                    ) : (
                      <span className="text-[9px] text-text-dim">No properties</span>
                    )}
                  </div>

                  {/* Bank + View Sets pinned at bottom */}
                  <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border-dim">
                    <div className="flex items-center gap-1 rounded-lg bg-secondary px-2 py-1.5 flex-1 min-w-0">
                      <Landmark className="h-3 w-3 text-foreground shrink-0" aria-hidden="true" />
                      <span className="text-[10px] font-bold text-card-green truncate">{"$"}{opp.bankTotal}M</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInspecting(opp)}
                      className="btn-3d btn-3d-ghost flex h-7 items-center justify-center gap-1 rounded-lg bg-secondary px-2 text-[10px] font-bold text-muted-foreground hover:text-foreground shrink-0"
                    >
                      <Eye className="h-3 w-3" aria-hidden="true" />
                      View
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {inspecting && <PropertyOverlay player={inspecting} onClose={() => setInspecting(null)} />}
    </>
  )
}
