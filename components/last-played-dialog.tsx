"use client";

import { cn } from "@/lib/utils";
import type { GameCard as GameCardType } from "@/lib/game-types";
import { GameCard } from "@/components/game-card";
import { X, Layers } from "lucide-react";

interface LastPlayedDialogProps {
  cards: GameCardType[];
  onClose: () => void;
}

export function LastPlayedDialog({ cards, onClose }: LastPlayedDialogProps) {
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-background"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-x-4 top-16 bottom-16 z-50 flex flex-col rounded-3xl border-2 border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-subtle">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Table Cards
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {cards.length} card{cards.length !== 1 ? "s" : ""} played to the middle
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-3d btn-3d-ghost flex h-8 w-8 items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {cards.length === 0 ? (
            <p className="text-center text-sm text-text-dim py-8">
              No cards played to the table yet
            </p>
          ) : (
            <div className="flex flex-wrap gap-3 justify-center">
              {[...cards].reverse().map((card, i) => (
                <GameCard key={`${card.id}-${i}`} card={card} size="md" />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
