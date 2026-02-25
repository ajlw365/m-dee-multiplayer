"use client";

import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { GameCard } from "@/components/game-card";
import type { GameCard as GameCardType, Player } from "@/lib/game-types";
import { isPropertyCard, isActionCard, isMoneyCard } from "@/lib/game-types";
import { TargetPlayerPopup } from "@/components/target-player-popup";
import {
  Hand,
  CheckSquare,
  Landmark,
  SkipForward,
  Flame,
  ChevronUp,
} from "lucide-react";

const MAX_HAND = 7;

interface PlayerHandProps {
  cards: GameCardType[];
  isPlayerTurn: boolean;
  actionsRemaining: number;
  opponents: Player[];
  pendingBurn: boolean;
  onPlayCard?: (cardId: string, targetPlayerId?: string) => void;
  onBankCard?: (cardId: string) => void;
  onEndTurn?: () => void;
  onRotateTurn?: () => void;
  onBurnCards?: (cardIds: string[]) => void;
  onCollapse?: () => void;
}

export function PlayerHand({
  cards,
  isPlayerTurn,
  actionsRemaining,
  opponents,
  pendingBurn,
  onPlayCard,
  onBankCard,
  onEndTurn,
  onRotateTurn,
  onBurnCards,
  onCollapse,
}: PlayerHandProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [burnMode, setBurnMode] = useState(false);
  const [burnIds, setBurnIds] = useState<Set<string>>(new Set());
  const [showTargetPopup, setShowTargetPopup] = useState(false);

  const needsBurn = cards.length > MAX_HAND;

  useEffect(() => {
    if (pendingBurn && cards.length > MAX_HAND && !burnMode) {
      setBurnMode(true);
      setSelectedId(null);
    }
    if (cards.length <= MAX_HAND && burnMode) {
      setBurnMode(false);
      setBurnIds(new Set());
    }
  }, [cards.length, burnMode, pendingBurn]);

  const burnRequired = cards.length - MAX_HAND;

  const selectedCard = cards.find((c) => c.id === selectedId) ?? null;
  const isMoney = selectedCard && isMoneyCard(selectedCard);
  const canBank = selectedCard && !isPropertyCard(selectedCard);

  // Check if selected card targets a player
  const selectedIsTargeted =
    selectedCard && isActionCard(selectedCard) && selectedCard.targetPlayer;

  const handlePlay = useCallback(() => {
    if (!selectedId || !selectedCard) return;
    if (isActionCard(selectedCard) && selectedCard.targetPlayer) {
      setShowTargetPopup(true);
    } else {
      onPlayCard?.(selectedId);
      setSelectedId(null);
    }
  }, [selectedId, selectedCard, onPlayCard]);

  const handleTargetSelect = useCallback(
    (playerId: string) => {
      if (selectedId) {
        onPlayCard?.(selectedId, playerId);
        setSelectedId(null);
      }
      setShowTargetPopup(false);
    },
    [selectedId, onPlayCard],
  );

  const handleEndTurn = useCallback(() => {
    onEndTurn?.();
  }, [onEndTurn]);

  const toggleBurn = useCallback(
    (id: string) => {
      setBurnIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else if (next.size < burnRequired) {
          next.add(id);
        }
        return next;
      });
    },
    [burnRequired],
  );

  const confirmBurn = useCallback(() => {
    if (burnIds.size === burnRequired) {
      onBurnCards?.(Array.from(burnIds));
      setBurnMode(false);
      setBurnIds(new Set());
    }
  }, [burnIds, burnRequired, onBurnCards]);

  return (
    <>
      <section
        className="border-t-2 border-border bg-card"
        aria-label="Your hand"
      >
        {/* Header row */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-1">
          <Hand
            className="h-3.5 w-3.5 text-muted-foreground"
            aria-hidden="true"
          />
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Your Hand
          </h2>
          <span
            className={cn(
              "ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
              cards.length > MAX_HAND
                ? "bg-destructive text-destructive-foreground"
                : "bg-primary-subtle text-primary",
            )}
          >
            {cards.length}/{MAX_HAND}
          </span>
          <button
            type="button"
            onClick={onCollapse}
            className="btn-3d btn-3d-ghost flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary-subtle"
            aria-label="Collapse hand"
            aria-expanded={true}
          >
            <ChevronUp className="h-4 w-4" />
          </button>
        </div>

        {/* Burn mode banner */}
        {burnMode && (
          <div className="mx-4 mt-1 flex items-center gap-2 rounded-xl bg-destructive-subtle border border-destructive px-3 py-2">
            <Flame
              className="h-4 w-4 text-destructive shrink-0"
              aria-hidden="true"
            />
            <p className="text-[10px] font-bold text-destructive flex-1">
              Discard {burnRequired} card{burnRequired > 1 ? "s" : ""} to get to{" "}
              {MAX_HAND}. Selected: {burnIds.size}/{burnRequired}
            </p>
            <button
              type="button"
              disabled={burnIds.size !== burnRequired}
              onClick={confirmBurn}
              className={cn(
                "btn-3d btn-3d-danger shrink-0 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase",
                burnIds.size === burnRequired
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-secondary text-muted-foreground opacity-50 cursor-not-allowed",
              )}
            >
              Burn
            </button>
          </div>
        )}

        {/* Card list */}
        <div className="flex gap-2.5 overflow-x-auto px-4 pb-4 pt-2 scrollbar-hide">
          {cards.map((card) => (
            <div key={card.id} className="shrink-0">
              <GameCard
                card={card}
                size="md"
                selected={!burnMode && selectedId === card.id}
                burnMode={burnMode}
                burnSelected={burnMode && burnIds.has(card.id)}
                onClick={() => {
                  if (burnMode) {
                    toggleBurn(card.id);
                  } else {
                    setSelectedId((prev) =>
                      prev === card.id ? null : card.id,
                    );
                  }
                }}
              />
            </div>
          ))}
        </div>

        {/* Action buttons: visible when player's turn + card selected + not in burn mode */}
        {isPlayerTurn && selectedId && !burnMode && (
          <div className="flex items-center gap-2 px-4 pb-4">
            {!isMoney && (
              <button
                type="button"
                onClick={handlePlay}
                className="btn-3d btn-3d-primary flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground uppercase tracking-wide"
              >
                <CheckSquare className="h-4 w-4" aria-hidden="true" />
                Play
              </button>
            )}

            {canBank && (
              <button
                type="button"
                onClick={() => {
                  onBankCard?.(selectedId);
                  setSelectedId(null);
                }}
                className="btn-3d btn-3d-yellow flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-card-yellow py-2.5 text-xs font-bold text-[oklch(0.20_0.04_85)] uppercase tracking-wide"
              >
                <Landmark className="h-4 w-4" aria-hidden="true" />
                Bank
              </button>
            )}

            <button
              type="button"
              onClick={handleEndTurn}
              className="btn-3d btn-3d-danger flex items-center justify-center gap-1.5 rounded-xl bg-destructive px-4 py-2.5 text-xs font-bold text-destructive-foreground uppercase tracking-wide"
            >
              <SkipForward className="h-4 w-4" aria-hidden="true" />
              End
            </button>
          </div>
        )}

        {/* End Turn button when turn is active but no card selected */}
        {isPlayerTurn && !selectedId && !burnMode && actionsRemaining > 0 && (
          <div className="flex items-center gap-2 px-4 pb-4">
            <button
              type="button"
              onClick={handleEndTurn}
              className="btn-3d btn-3d-danger flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-destructive py-2.5 text-xs font-bold text-destructive-foreground uppercase tracking-wide"
            >
              <SkipForward className="h-4 w-4" aria-hidden="true" />
              End Turn ({actionsRemaining} left)
            </button>
          </div>
        )}
      </section>

      {/* Target Player Popup */}
      {showTargetPopup && selectedCard && isActionCard(selectedCard) && (
        <TargetPlayerPopup
          opponents={opponents}
          cardName={selectedCard.name}
          onSelect={handleTargetSelect}
          onCancel={() => setShowTargetPopup(false)}
        />
      )}
    </>
  );
}
