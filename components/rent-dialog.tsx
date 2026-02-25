"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { CardColor, Player, GameCard as GameCardType } from "@/lib/game-types";
import { isActionCard } from "@/lib/game-types";
import { DollarSign, X, Zap } from "lucide-react";

const COLOR_META: Record<
  CardColor,
  { label: string; banner: string; text: string }
> = {
  darkblue: {
    label: "Dark Blue",
    banner: "bg-card-darkblue-banner",
    text: "text-white",
  },
  lightblue: {
    label: "Light Blue",
    banner: "bg-card-lightblue-banner",
    text: "text-white",
  },
  brown: { label: "Brown", banner: "bg-card-brown-banner", text: "text-white" },
  green: { label: "Green", banner: "bg-card-green-banner", text: "text-white" },
  utility: {
    label: "Utility",
    banner: "bg-card-utility-banner",
    text: "text-white",
  },
  red: { label: "Red", banner: "bg-card-red-banner", text: "text-white" },
  yellow: {
    label: "Yellow",
    banner: "bg-[var(--card-yellow)]",
    text: "text-[oklch(0.20_0.04_85)]",
  },
  orange: {
    label: "Orange",
    banner: "bg-card-orange-banner",
    text: "text-white",
  },
  pink: { label: "Pink", banner: "bg-card-pink-banner", text: "text-white" },
  railroad: {
    label: "Railroad",
    banner: "bg-card-railroad-banner",
    text: "text-white",
  },
  purple: {
    label: "Purple",
    banner: "bg-card-purple-banner",
    text: "text-white",
  },
  all: {
    label: "All",
    banner: "bg-muted",
    text: "text-foreground",
  },
};

interface RentDialogProps {
  availableColors: CardColor[];
  opponents: Player[];
  rentAmount: number;
  isWildRent: boolean;
  playerHand: GameCardType[];
  actionsRemaining: number;
  onResolveColor: (color: CardColor) => void;
  onConfirm: (targetPlayerIds: string[], useDoubleRent?: boolean) => void;
  onCancel: () => void;
}

export function RentDialog({
  availableColors,
  opponents,
  rentAmount,
  isWildRent,
  playerHand,
  actionsRemaining,
  onResolveColor,
  onConfirm,
  onCancel,
}: RentDialogProps) {
  const [selectedColor, setSelectedColor] = useState<CardColor | null>(
    availableColors.length === 1 ? availableColors[0] : null,
  );
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [doubleRent, setDoubleRent] = useState(false);

  useEffect(() => {
    if (availableColors.length === 1 && selectedColor) {
      onResolveColor(selectedColor);
    }
  }, [availableColors, selectedColor, onResolveColor]);

  const hasDoubleRentCard = playerHand.some(
    (c) => isActionCard(c) && c.name.toUpperCase().includes("DOUBLE THE RENT"),
  );
  const canDoubleRent = hasDoubleRentCard && actionsRemaining >= 2;

  const displayRentAmount = doubleRent ? rentAmount * 2 : rentAmount;

  const handleColorSelect = (color: CardColor) => {
    setSelectedColor(color);
    onResolveColor(color);
  };

  const handleConfirm = () => {
    if (!selectedColor) return;
    if (isWildRent) {
      if (!selectedTargetId) return;
      onConfirm([selectedTargetId], doubleRent);
    } else {
      onConfirm(opponents.map((o) => o.id), doubleRent);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rent-dialog-title"
        className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-3xl border-2 border-border bg-card p-5 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-subtle">
              <DollarSign className="h-4 w-4 text-primary" aria-hidden="true" />
            </div>
            <h2
              id="rent-dialog-title"
              className="text-sm font-black text-foreground uppercase tracking-wide"
            >
              Collect Rent
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="btn-3d btn-3d-ghost flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
            aria-label="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Color picker — only shown if more than one option */}
        {availableColors.length > 1 && (
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Which set?
            </p>
            <div className="flex flex-wrap gap-2">
              {availableColors.map((color) => {
                const meta = COLOR_META[color];
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorSelect(color)}
                    className={cn(
                      "rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wide transition-all",
                      meta.banner,
                      meta.text,
                      selectedColor === color
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105"
                        : "opacity-70 hover:opacity-100",
                    )}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Rent amount + targets */}
        {selectedColor && (
          <div className="mb-5">
            <div className="rounded-2xl bg-secondary px-4 py-3 mb-3 text-center">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
                Rent Due
              </p>
              <p className={cn("text-3xl font-black", doubleRent ? "text-card-orange" : "text-foreground")}>
                ${displayRentAmount}M
              </p>
              {doubleRent && (
                <p className="text-[9px] font-bold text-card-orange mt-0.5">
                  DOUBLED!
                </p>
              )}
              <p className="text-[9px] text-muted-foreground mt-0.5">
                {isWildRent ? "choose one player" : "from all players"}
              </p>
            </div>

            {/* Double the Rent toggle */}
            <button
              type="button"
              onClick={() => {
                if (canDoubleRent) setDoubleRent(!doubleRent);
              }}
              disabled={!canDoubleRent}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 mb-3 transition-all",
                doubleRent
                  ? "bg-card-orange text-white border-2 border-card-orange"
                  : canDoubleRent
                    ? "bg-secondary border-2 border-transparent hover:border-card-orange/30 cursor-pointer"
                    : "bg-secondary border-2 border-transparent opacity-40 cursor-not-allowed",
              )}
            >
              <Zap className={cn("h-4 w-4", doubleRent ? "text-white" : "text-card-orange")} />
              <span className={cn("text-[10px] font-bold uppercase tracking-wide", doubleRent ? "text-white" : "text-foreground")}>
                Double the Rent
              </span>
              {!hasDoubleRentCard && (
                <span className="text-[8px] text-muted-foreground ml-1">(not in hand)</span>
              )}
              {hasDoubleRentCard && actionsRemaining < 2 && (
                <span className="text-[8px] text-muted-foreground ml-1">(need 2 actions)</span>
              )}
            </button>
            {opponents.length > 0 && (
              <div className="space-y-1">
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                  {isWildRent ? "Choose Target" : "Charging"}
                </p>
                {opponents.map((opp) => (
                  <button
                    key={opp.id}
                    type="button"
                    onClick={() => {
                      if (isWildRent) setSelectedTargetId(opp.id);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-3 py-2 transition-all",
                      isWildRent
                        ? selectedTargetId === opp.id
                          ? "bg-primary/10 border-2 border-primary"
                          : "bg-secondary border-2 border-transparent hover:border-primary/30 cursor-pointer"
                        : "bg-secondary",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[9px] font-black text-primary-foreground">
                        {opp.avatar}
                      </div>
                      <span className="text-[10px] font-bold text-foreground">
                        {opp.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-primary">
                      -${Math.min(rentAmount, opp.bankTotal)}M
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="btn-3d btn-3d-ghost flex flex-1 h-10 items-center justify-center rounded-xl bg-secondary text-foreground font-semibold text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedColor || displayRentAmount === 0 || (isWildRent && !selectedTargetId)}
            className={cn(
              "btn-3d btn-3d-primary flex flex-1 h-10 items-center justify-center rounded-xl font-bold text-sm uppercase tracking-wide",
              selectedColor && displayRentAmount > 0
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground opacity-50 cursor-not-allowed",
            )}
          >
            Collect ${displayRentAmount}M
          </button>
        </div>
      </div>
    </>
  );
}
