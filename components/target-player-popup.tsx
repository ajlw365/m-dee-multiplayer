"use client"

import { cn } from "@/lib/utils"
import type { Player } from "@/lib/game-types"
import { X, Target, Landmark } from "lucide-react"

interface TargetPlayerPopupProps {
  opponents: Player[]
  cardName: string
  onSelect: (playerId: string) => void
  onCancel: () => void
}

export function TargetPlayerPopup({ opponents, cardName, onSelect, onCancel }: TargetPlayerPopupProps) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-[oklch(0.10_0.01_260/0.6)]" onClick={onCancel} aria-hidden="true" />

      {/* Popup */}
      <div className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-sm rounded-3xl border-2 border-border bg-card p-5 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive-subtle">
              <Target className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Choose Target</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Playing <span className="font-bold text-foreground">{cardName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="btn-3d btn-3d-ghost flex h-8 w-8 items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:text-foreground"
            aria-label="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Player list */}
        <div className="flex flex-col gap-2">
          {opponents.map((opp) => {
            const completeSets = opp.propertySets.filter((s) => s.isComplete).length
            return (
              <button
                key={opp.id}
                type="button"
                onClick={() => onSelect(opp.id)}
                className={cn(
                  "btn-3d btn-3d-secondary flex items-center gap-3 rounded-2xl border-2 border-border bg-card p-3",
                  "hover:border-primary hover:bg-primary-subtle transition-colors"
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground shrink-0">
                  {opp.avatar}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{opp.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <div className="flex items-center gap-1">
                      <Landmark className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                      <span className="text-[10px] font-bold text-card-green">${opp.bankTotal}M</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {completeSets} set{completeSets !== 1 ? "s" : ""}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {opp.propertySets.reduce((a, s) => a + s.cards.length, 0)} properties
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Cancel */}
        <button
          type="button"
          onClick={onCancel}
          className="btn-3d btn-3d-ghost mt-3 w-full rounded-xl bg-secondary py-2.5 text-xs font-bold text-muted-foreground uppercase tracking-wide hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </>
  )
}
