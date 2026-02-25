"use client"

import { cn } from "@/lib/utils"
import type { GameCard as GameCardType } from "@/lib/game-types"
import { isActionCard } from "@/lib/game-types"
import { GameCard } from "@/components/game-card"
import { Eye, RefreshCw } from "lucide-react"

interface PlayAreaProps {
  playAreaCard: GameCardType | null
  actionsRemaining: number
  turnCount: number
  isPlayerTurn: boolean
  deckCount: number
  middlePileCount: number
  onViewMiddle: () => void
  onReshuffle: () => void
}

function isTableCard(card: GameCardType): boolean {
  return isActionCard(card) || ("type" in card && card.type === "rent")
}

export function PlayArea({ playAreaCard, actionsRemaining, turnCount, isPlayerTurn, deckCount, middlePileCount, onViewMiddle, onReshuffle }: PlayAreaProps) {
  const showCard = playAreaCard && isTableCard(playAreaCard)

  return (
    <section className="flex flex-col px-4 py-3" aria-label="Table area">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Table
          </h2>
          {middlePileCount > 0 && (
            <button
              type="button"
              onClick={onViewMiddle}
              className="btn-3d btn-3d-ghost flex h-5 items-center gap-1 rounded-md bg-secondary px-1.5 text-[8px] font-bold text-muted-foreground hover:text-foreground"
            >
              <Eye className="h-2.5 w-2.5" />
              {middlePileCount}
            </button>
          )}
        </div>
        {deckCount === 0 && (
          <button
            type="button"
            onClick={onReshuffle}
            className="btn-3d btn-3d-primary flex h-6 items-center gap-1 rounded-lg bg-primary px-2 text-[8px] font-bold text-primary-foreground uppercase tracking-wide"
          >
            <RefreshCw className="h-3 w-3" />
            Reshuffle
          </button>
        )}
      </div>

      {/* Card centred + Turn info on the right */}
      <div className="flex items-center justify-center gap-5">
        {/* Card display - dead centre */}
        <div className="flex flex-col items-center gap-1.5">
          {showCard ? (
            <GameCard card={playAreaCard!} size="sm" />
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border bg-play-area w-11 h-[62px] justify-center">
              <p className="text-[5px] text-text-subdued font-medium text-center leading-tight px-0.5">
                No action
              </p>
            </div>
          )}
        </div>

        {/* Turn info + Deck counter - stacked vertically on right */}
        <div className="flex flex-col items-start gap-1.5">
          {/* Deck counter */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-secondary/50 border border-border/50">
            <div className="w-1.5 h-2 rounded-sm bg-primary/40" />
            <span className="text-[9px] font-bold text-muted-foreground tracking-tight">
              DECK: {deckCount}
            </span>
          </div>

          {/* Turn Count */}
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
            Turn {turnCount}
          </span>

          {/* Your Turn Badge */}
          {isPlayerTurn && (
            <span className="rounded-full bg-primary-subtle px-2.5 py-0.5 text-[9px] font-bold text-primary uppercase tracking-wider">
              Your Turn
            </span>
          )}

          {/* Actions Remaining */}
          <div className="flex items-center gap-1.5">
            <div className="flex gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-2 w-2 rounded-full",
                    i < actionsRemaining ? "bg-primary" : "bg-secondary"
                  )}
                />
              ))}
            </div>
            <span className="text-[9px] text-muted-foreground font-medium">
              {actionsRemaining} left
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
