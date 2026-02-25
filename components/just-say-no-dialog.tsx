"use client";

import { cn } from "@/lib/utils";
import { Ban, Shield, X } from "lucide-react";

interface JustSayNoDialogProps {
  attackerName: string;
  actionDescription: string;
  onUseJustSayNo: () => void;
  onAllow: () => void;
}

export function JustSayNoDialog({ attackerName, actionDescription, onUseJustSayNo, onAllow }: JustSayNoDialogProps) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-3xl border-2 border-border bg-card p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[oklch(0.90_0.10_260)]">
              <Shield className="h-4 w-4 text-[oklch(0.42_0.18_260)]" />
            </div>
            <h2 className="text-sm font-black text-foreground uppercase tracking-wide">
              Incoming Action!
            </h2>
          </div>
        </div>

        <div className="rounded-2xl bg-secondary px-4 py-4 mb-4 text-center">
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
            {attackerName} used
          </p>
          <p className="text-sm font-black text-foreground">{actionDescription}</p>
        </div>

        <p className="text-[10px] text-muted-foreground text-center mb-5">
          You have a <span className="font-bold text-[oklch(0.42_0.18_260)]">Just Say No</span> card. Would you like to block this action?
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onAllow}
            className="btn-3d btn-3d-ghost flex flex-1 h-10 items-center justify-center gap-1.5 rounded-xl bg-secondary text-foreground font-semibold text-sm"
          >
            Allow It
          </button>
          <button
            type="button"
            onClick={onUseJustSayNo}
            className="btn-3d btn-3d-primary flex flex-1 h-10 items-center justify-center gap-1.5 rounded-xl bg-[oklch(0.42_0.18_260)] text-white font-bold text-sm uppercase tracking-wide"
          >
            <Ban className="h-4 w-4" />
            Just Say No!
          </button>
        </div>
      </div>
    </>
  );
}
