"use client";

import { cn } from "@/lib/utils";
import type { PropertySet, CardColor } from "@/lib/game-types";
import { Home, Building2, X } from "lucide-react";

const COLOR_META: Record<CardColor, { label: string; banner: string; text: string }> = {
  darkblue: { label: "Dark Blue", banner: "bg-card-darkblue-banner", text: "text-white" },
  lightblue: { label: "Light Blue", banner: "bg-card-lightblue-banner", text: "text-white" },
  brown: { label: "Brown", banner: "bg-card-brown-banner", text: "text-white" },
  green: { label: "Green", banner: "bg-card-green-banner", text: "text-white" },
  utility: { label: "Utility", banner: "bg-card-utility-banner", text: "text-white" },
  red: { label: "Red", banner: "bg-card-red-banner", text: "text-white" },
  yellow: { label: "Yellow", banner: "bg-[var(--card-yellow)]", text: "text-[oklch(0.20_0.04_85)]" },
  orange: { label: "Orange", banner: "bg-card-orange-banner", text: "text-white" },
  pink: { label: "Pink", banner: "bg-card-pink-banner", text: "text-white" },
  railroad: { label: "Railroad", banner: "bg-card-railroad-banner", text: "text-white" },
  purple: { label: "Purple", banner: "bg-card-purple-banner", text: "text-white" },
  all: { label: "All", banner: "bg-muted", text: "text-foreground" },
};

interface HouseHotelDialogProps {
  type: "house" | "hotel";
  completeSets: PropertySet[];
  onConfirm: (color: CardColor) => void;
  onCancel: () => void;
}

export function HouseHotelDialog({ type, completeSets, onConfirm, onCancel }: HouseHotelDialogProps) {
  const isHotel = type === "hotel";
  const Icon = isHotel ? Building2 : Home;
  const title = isHotel ? "Place Hotel" : "Place House";
  const description = isHotel
    ? "Choose a complete set with a house to upgrade to a hotel (+4M rent)"
    : "Choose a complete set to add a house (+3M rent)";

  const eligibleSets = isHotel
    ? completeSets.filter((s) => s.cards.some((c) => c.name.toUpperCase().includes("HOUSE")) && !s.cards.some((c) => c.name.toUpperCase().includes("HOTEL")))
    : completeSets.filter((s) => !s.cards.some((c) => c.name.toUpperCase().includes("HOUSE")));

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onCancel} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-3xl border-2 border-border bg-card p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-full", isHotel ? "bg-card-red-bg" : "bg-card-green-bg")}>
              <Icon className={cn("h-4 w-4", isHotel ? "text-card-red" : "text-card-green")} />
            </div>
            <h2 className="text-sm font-black text-foreground uppercase tracking-wide">{title}</h2>
          </div>
          <button type="button" onClick={onCancel} className="btn-3d btn-3d-ghost flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground" aria-label="Cancel">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-[10px] text-muted-foreground mb-4">{description}</p>

        {eligibleSets.length === 0 ? (
          <div className="rounded-2xl bg-secondary px-4 py-6 text-center mb-4">
            <p className="text-[10px] font-bold text-muted-foreground">
              {isHotel ? "No complete sets with a house available" : "No complete sets available"}
            </p>
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            {eligibleSets.map((set) => {
              const meta = COLOR_META[set.color];
              return (
                <button
                  key={set.color}
                  type="button"
                  onClick={() => onConfirm(set.color)}
                  className="flex w-full items-center justify-between rounded-xl bg-secondary px-3 py-3 hover:bg-secondary/80 transition-all cursor-pointer border-2 border-transparent hover:border-primary/30"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", meta.banner)}>
                      <span className={cn("text-[8px] font-black uppercase", meta.text)}>{set.cards.length}</span>
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-foreground">{meta.label}</p>
                      <p className="text-[8px] text-muted-foreground">
                        {set.cards.length}/{set.requiredCount} cards
                        {set.cards.some((c) => c.name.toUpperCase().includes("HOUSE")) && " + House"}
                      </p>
                    </div>
                  </div>
                  <span className={cn("text-[9px] font-black uppercase tracking-wide", isHotel ? "text-card-red" : "text-card-green")}>
                    +{isHotel ? "4" : "3"}M
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <button type="button" onClick={onCancel} className="btn-3d btn-3d-ghost flex w-full h-10 items-center justify-center rounded-xl bg-secondary text-foreground font-semibold text-sm">
          Cancel
        </button>
      </div>
    </>
  );
}
