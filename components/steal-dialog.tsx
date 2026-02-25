"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { Player, CardColor } from "@/lib/game-types"
import { X, Target, Landmark, Check } from "lucide-react"

interface StealDialogProps {
  opponents: Player[]
  mode: "property" | "set"
  cardName: string
  onConfirmProperty: (targetPlayerId: string, propertyId: string) => void
  onConfirmSet: (targetPlayerId: string, color: CardColor) => void
  onCancel: () => void
}

export function StealDialog({
  opponents,
  mode,
  cardName,
  onConfirmProperty,
  onConfirmSet,
  onCancel,
}: StealDialogProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)

  // FIX 3: Update filtering logic to handle stale isComplete flags
  const validOpponents = opponents.filter((o) =>
    mode === "property"
      ? o.propertySets.some((ps) => ps.cards.length > 0 && !ps.isComplete)
      : o.propertySets.some((ps) => ps.cards.length >= ps.requiredCount && ps.isComplete)
  )

  const selectedPlayer = opponents.find((o) => o.id === selectedPlayerId)

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 rounded-3xl border-2 border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {mode === "property" ? "Sly Deal" : "Deal Breaker"}
              </h3>
              <p className="text-xs text-muted-foreground">Choose an opponent to steal from</p>
            </div>
          </div>
          <button onClick={onCancel} className="rounded-full p-2 hover:bg-secondary">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {!selectedPlayerId ? (
          <div className="grid gap-3">
            {validOpponents.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">No valid targets available.</p>
            ) : (
              validOpponents.map((opp) => (
                <button
                  key={opp.id}
                  onClick={() => setSelectedPlayerId(opp.id)}
                  className="flex items-center gap-4 rounded-2xl border-2 border-border bg-card p-4 hover:border-primary hover:bg-primary/5 transition-all text-left"
                >
                  <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center font-bold text-lg">
                    {opp.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-foreground">{opp.name}</p>
                    <div className="flex gap-3 mt-1">
                      <span className="text-[10px] text-muted-foreground">
                        {opp.propertySets.length} Sets
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {opp.propertySets.reduce((acc, s) => acc + s.cards.length, 0)} Properties
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <button 
                onClick={() => setSelectedPlayerId(null)}
                className="text-xs font-bold text-primary hover:underline"
              >
                ← Back to players
              </button>
            </div>
            <p className="text-sm font-medium">Select what to steal from {selectedPlayer?.name}:</p>
            <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2">
              {selectedPlayer?.propertySets
                .filter((ps) => 
                  mode === "property" 
                    ? (ps.cards.length > 0 && !ps.isComplete)
                    : (ps.cards.length >= ps.requiredCount && ps.isComplete)
                )
                .map((ps, idx) => (
                  <div key={`${ps.color}-${idx}`} className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2">
                      {ps.color} {ps.isComplete && " (Complete)"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {mode === "property" ? (
                        ps.cards.map((card) => (
                          <button
                            key={card.id}
                            onClick={() => onConfirmProperty(selectedPlayer.id, card.id)}
                            className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border bg-secondary/30 hover:border-primary hover:bg-primary/5 transition-all"
                          >
                            <div className="w-16 h-20 rounded border border-border bg-white flex flex-col overflow-hidden shadow-sm">
                              <div className={cn("h-4 w-full", `bg-card-${ps.color}-banner`)} />
                              <div className="flex-1 flex items-center justify-center p-1">
                                <span className="text-[6px] font-bold text-center leading-tight line-clamp-3">{card.name}</span>
                              </div>
                            </div>
                            <span className="text-[8px] font-bold">${card.value}M</span>
                          </button>
                        ))
                      ) : (
                        <button
                          onClick={() => onConfirmSet(selectedPlayer.id, ps.color)}
                          className="w-full flex items-center justify-between p-3 rounded-xl border-2 border-border bg-secondary/20 hover:border-primary hover:bg-primary/5 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn("h-8 w-6 rounded border border-border", `bg-card-${ps.color}-banner`)} />
                            <span className="text-sm font-bold capitalize">{ps.color} Set</span>
                          </div>
                          <Check className="h-4 w-4 text-primary" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        <button
          onClick={onCancel}
          className="mt-6 w-full rounded-xl bg-secondary py-3 text-sm font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </>
  )
}
