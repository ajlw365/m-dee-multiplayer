"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface WinScreenProps {
  winnerName: string;
  isHumanWinner: boolean;
  onPlayAgain: () => void;
}

const CONFETTI_COLORS = [
  "bg-card-darkblue-banner",
  "bg-card-green-banner",
  "bg-card-red-banner",
  "bg-card-yellow",
  "bg-card-pink-banner",
  "bg-card-orange-banner",
  "bg-card-lightblue-banner",
  "bg-card-purple-banner",
];

function ConfettiPiece({ index }: { index: number }) {
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const left = `${(index * 7.3) % 100}%`;
  const delay = `${(index * 0.15) % 3}s`;
  const duration = `${2.5 + (index % 3) * 0.5}s`;
  const isRect = index % 3 !== 0;

  return (
    <div
      className={cn(
        "absolute top-0 opacity-0",
        color,
        isRect ? "w-2 h-3 rounded-sm" : "w-2.5 h-2.5 rounded-full",
      )}
      style={{
        left,
        animationName: "confettiFall",
        animationDuration: duration,
        animationDelay: delay,
        animationTimingFunction: "linear",
        animationIterationCount: "infinite",
        animationFillMode: "both",
      }}
    />
  );
}

export function WinScreen({
  winnerName,
  isHumanWinner,
  onPlayAgain,
}: WinScreenProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {/* Confetti keyframes */}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes popIn {
          0%   { transform: translate(-50%, -50%) scale(0.7); opacity: 0; }
          70%  { transform: translate(-50%, -50%) scale(1.05); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1);    opacity: 1; }
        }
      `}</style>

      {/* Full screen backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/70 transition-opacity duration-500",
          visible ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Confetti pieces */}
      <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
        {Array.from({ length: 40 }).map((_, i) => (
          <ConfettiPiece key={i} index={i} />
        ))}
      </div>

      {/* Win card */}
      <div
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-xs px-4"
        style={{
          animationName: visible ? "popIn" : "none",
          animationDuration: "0.4s",
          animationFillMode: "both",
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="rounded-3xl border-2 border-border bg-card p-6 text-center shadow-2xl">
          {/* Trophy */}
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--card-yellow)] text-4xl shadow-lg">
              🏆
            </div>
          </div>

          {/* Winner text */}
          <h1 className="text-2xl font-black text-foreground uppercase tracking-wide mb-1">
            {isHumanWinner ? "You Win!" : `${winnerName} Wins!`}
          </h1>
          <p className="text-[11px] text-muted-foreground mb-2">
            {isHumanWinner
              ? "Congratulations! You completed 3 full property sets."
              : `${winnerName} completed 3 full property sets first.`}
          </p>

          {/* Completed sets badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-subtle px-3 py-1 mb-6">
            <span className="text-[10px] font-black text-primary uppercase tracking-wider">
              3 Complete Sets
            </span>
          </div>

          {/* Play again button */}
          <button
            type="button"
            onClick={onPlayAgain}
            className="btn-3d btn-3d-primary flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-black text-primary-foreground uppercase tracking-wide"
          >
            Play Again
          </button>
        </div>
      </div>
    </>
  );
}
