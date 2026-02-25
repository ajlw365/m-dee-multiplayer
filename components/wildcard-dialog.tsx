"use client";

import { cn } from "@/lib/utils";
import type { CardColor } from "@/lib/game-types";
import { Shuffle, X } from "lucide-react";

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
};

interface WildcardDialogProps {
  availableColors: CardColor[];
  onConfirm: (color: CardColor) => void;
  onCancel: () => void;
}

export function WildcardDialog({
  availableColors,
  onConfirm,
  onCancel,
}: WildcardDialogProps) {
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
        className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-3xl border-2 border-border bg-card p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-subtle">
              <Shuffle className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-sm font-black text-foreground uppercase tracking-wide">
              Place Wildcard
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="btn-3d btn-3d-ghost flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-[10px] text-muted-foreground mb-4">
          Choose which property set to add this wildcard to:
        </p>

        <div className="flex flex-wrap gap-2 mb-2">
          {availableColors.map((color) => {
            const meta = COLOR_META[color];
            if (!meta) return null;
            return (
              <button
                key={color}
                type="button"
                onClick={() => onConfirm(color)}
                className={cn(
                  "rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-wide transition-all hover:scale-105",
                  meta.banner,
                  meta.text,
                )}
              >
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
