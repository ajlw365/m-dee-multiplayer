"use client"

import { cn } from "@/lib/utils"
import type { MoveLogEntry } from "@/lib/game-types"
import { X, ScrollText } from "lucide-react"

interface MoveLogProps {
  entries: MoveLogEntry[]
  isOpen: boolean
  onClose: () => void
}

export function MoveLog({ entries, isOpen, onClose }: MoveLogProps) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          "fixed right-0 top-0 z-50 h-dvh w-72 bg-card border-l-2 border-border transition-transform duration-300 ease-out flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-label="Move log"
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <div className="flex items-center gap-2.5">
            <ScrollText className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2 className="text-sm font-bold text-foreground">Move Log</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-3d btn-3d-ghost flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground"
            aria-label="Close move log"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="flex flex-col gap-2.5">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-xl bg-secondary px-3 py-2.5 border border-border"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-bold text-foreground">
                    {entry.playerName}
                  </span>
                  <span className="text-[9px] text-text-dim shrink-0">
                    {entry.timestamp}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
                  {entry.action}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
