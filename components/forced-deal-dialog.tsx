"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { Player, CardColor, PropertySet } from "@/lib/game-types"
import { X, ArrowRightLeft, ChevronRight } from "lucide-react"

interface ForcedDealDialogProps {
  currentPlayer: Player
  opponents: Player[]
  onConfirm: (myPropertyId: string, mySetColor: CardColor, targetPlayerId: string, targetPropertyId: string) => void
  onCancel: () => void
}

export function ForcedDealDialog({
  currentPlayer,
  opponents,
  onConfirm,
  onCancel,
}: ForcedDealDialogProps) {
  const [step, setStep] = useState<"mine" | "opponent" | "their-property">("mine")
  const [myPropertyId, setMyPropertyId] = useState<string | null>(null)
  const [mySetColor, setMySetColor] = useState<CardColor | null>(null)
  const [selectedOpponentId, setSelectedOpponentId] = useState<string | null>(null)

  const myIncompleteCards = currentPlayer.propertySets
    .filter(ps => !ps.isComplete && ps.cards.length > 0)
    .flatMap(ps => ps.cards.map(c => ({ ...c, setColor: ps.color })))

  const validOpponents = opponents.filter(o =>
    o.propertySets.some(ps => !ps.isComplete && ps.cards.length > 0)
  )

  const selectedOpponent = opponents.find(o => o.id === selectedOpponentId)

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 rounded-3xl border-2 border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Forced Deal</h3>
              <p className="text-xs text-muted-foreground">
                {step === "mine" && "Choose YOUR property to give away"}
                {step === "opponent" && "Choose an opponent to swap with"}
                {step === "their-property" && `Choose a property from ${selectedOpponent?.name}`}
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="rounded-full p-2 hover:bg-secondary">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          {["mine", "opponent", "their-property"].map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className={cn(
                "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                step === s ? "bg-primary text-primary-foreground" :
                i < ["mine", "opponent", "their-property"].indexOf(step)
                  ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
              )}>
                {i + 1}
              </div>
              {i < 2 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {step === "mine" && (
          <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2">
            {myIncompleteCards.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">You have no properties to trade.</p>
            ) : (
              currentPlayer.propertySets
                .filter(ps => !ps.isComplete && ps.cards.length > 0)
                .map((ps, idx) => (
                  <div key={`${ps.color}-${idx}`} className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2">
                      {ps.color}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ps.cards.map(card => (
                        <button
                          key={card.id}
                          onClick={() => {
                            setMyPropertyId(card.id)
                            setMySetColor(ps.color)
                            setStep("opponent")
                          }}
                          className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border bg-secondary/30 hover:border-primary hover:bg-primary/5 transition-all"
                        >
                          <div className="w-16 h-20 rounded border border-border bg-white flex flex-col overflow-hidden shadow-sm">
                            <div className={cn("h-4 w-full")} style={{ backgroundColor: `var(--card-${ps.color})` }} />
                            <div className="flex-1 flex items-center justify-center p-1">
                              <span className="text-[6px] font-bold text-center leading-tight line-clamp-3">{card.name}</span>
                            </div>
                          </div>
                          <span className="text-[8px] font-bold">${card.value}M</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {step === "opponent" && (
          <div className="grid gap-3">
            <button
              onClick={() => setStep("mine")}
              className="text-xs font-bold text-primary hover:underline text-left"
            >
              ← Back
            </button>
            {validOpponents.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">No opponents have stealable properties.</p>
            ) : (
              validOpponents.map(opp => (
                <button
                  key={opp.id}
                  onClick={() => {
                    setSelectedOpponentId(opp.id)
                    setStep("their-property")
                  }}
                  className="flex items-center gap-4 rounded-2xl border-2 border-border bg-card p-4 hover:border-primary hover:bg-primary/5 transition-all text-left"
                >
                  <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center font-bold text-lg">
                    {opp.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-foreground">{opp.name}</p>
                    <span className="text-[10px] text-muted-foreground">
                      {opp.propertySets.filter(ps => !ps.isComplete && ps.cards.length > 0).reduce((a, s) => a + s.cards.length, 0)} stealable properties
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {step === "their-property" && selectedOpponent && (
          <div className="space-y-3">
            <button
              onClick={() => setStep("opponent")}
              className="text-xs font-bold text-primary hover:underline"
            >
              ← Back to opponents
            </button>
            <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2">
              {selectedOpponent.propertySets
                .filter(ps => !ps.isComplete && ps.cards.length > 0)
                .map((ps, idx) => (
                  <div key={`${ps.color}-${idx}`} className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2">
                      {ps.color}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ps.cards.map(card => (
                        <button
                          key={card.id}
                          onClick={() => {
                            if (myPropertyId && mySetColor) {
                              onConfirm(myPropertyId, mySetColor, selectedOpponent.id, card.id)
                            }
                          }}
                          className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border bg-secondary/30 hover:border-primary hover:bg-primary/5 transition-all"
                        >
                          <div className="w-16 h-20 rounded border border-border bg-white flex flex-col overflow-hidden shadow-sm">
                            <div className={cn("h-4 w-full")} style={{ backgroundColor: `var(--card-${ps.color})` }} />
                            <div className="flex-1 flex items-center justify-center p-1">
                              <span className="text-[6px] font-bold text-center leading-tight line-clamp-3">{card.name}</span>
                            </div>
                          </div>
                          <span className="text-[8px] font-bold">${card.value}M</span>
                        </button>
                      ))}
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
