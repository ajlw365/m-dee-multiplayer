"use client";

import { useState } from "react";
import type { GameState, Player, CardColor } from "@/lib/game-types";
import type { ActionResult, RentDialogState } from "@/lib/use-game-store";
import { OpponentArea } from "@/components/opponent-area";
import { PlayArea } from "@/components/play-area";
import { PlayerProperties } from "@/components/player-properties";
import { PlayerHand } from "@/components/player-hand";
import { MoveLog } from "@/components/move-log";
import { RentDialog } from "@/components/rent-dialog";
import { WildcardDialog } from "@/components/wildcard-dialog";
import { StealDialog } from "@/components/steal-dialog";
import { ForcedDealDialog } from "@/components/forced-deal-dialog";
import { LastPlayedDialog } from "@/components/last-played-dialog";
import { HouseHotelDialog } from "@/components/house-hotel-dialog";
import { JustSayNoDialog } from "@/components/just-say-no-dialog";
import type { GameCard as GameCardType } from "@/lib/game-types";
import {
  LogOut,
  ScrollText,
  Users,
  ChevronDown,
  AlertCircle,
} from "lucide-react";

interface GameTableProps {
  gameState: GameState;
  roomId: string;
  playerName: string;
  onLeave: () => void;
  onPlayCard?: (cardId: string, targetPlayerId?: string) => ActionResult | Promise<any>;
  onBankCard?: (cardId: string) => ActionResult | Promise<any>;
  onEndTurn?: () => void;
  onRotateTurn?: () => void;
  onBurnCards?: (cardIds: string[]) => ActionResult | Promise<any>;
  rentDialog: RentDialogState;
  rentAmount: number;
  opponents: Player[];
  onResolveRentColor: (color: CardColor) => void;
  onConfirmRent: (targetPlayerIds: string[], useDoubleRent?: boolean) => ActionResult | Promise<any>;
  onDismissRentDialog: () => void;
  wildcardDialog: {
    open: boolean;
    cardId: string | null;
    availableColors: CardColor[];
  };
  onConfirmWildcard: (cardId: string, chosenColor: CardColor) => void;
  onDismissWildcard: () => void;
  stealDialog: {
    open: boolean;
    mode: "property" | "set" | null;
    cardId: string | null;
    targetPlayerId: string | null;
  };
  onConfirmStealProperty: (targetPlayerId: string, propertyId: string) => void;
  onConfirmStealSet: (targetPlayerId: string, color: CardColor) => void;
  onDismissStealDialog: () => void;
  forcedDealDialog: {
    open: boolean;
    cardId: string | null;
  };
  onConfirmForcedDeal: (myPropertyId: string, mySetColor: CardColor, targetPlayerId: string, targetPropertyId: string) => void;
  onDismissForcedDeal: () => void;
  houseHotelDialog: {
    open: boolean;
    cardId: string | null;
    type: "house" | "hotel" | null;
  };
  onConfirmHouseHotel: (color: CardColor) => ActionResult | Promise<any>;
  onDismissHouseHotel: () => void;
  justSayNoDialog: {
    open: boolean;
    attackerName: string;
    actionDescription: string;
    pendingAction: (() => void) | null;
  };
  onUseJustSayNo: () => void;
  onAllowAction: () => void;
  pendingBurn: boolean;
  onReshuffleDeck: () => void;
  playerHand: GameCardType[];
}

export function GameTable({
  gameState,
  roomId,
  playerName,
  onLeave,
  onPlayCard,
  onBankCard,
  onEndTurn,
  onRotateTurn,
  onBurnCards,
  rentDialog,
  rentAmount,
  opponents,
  onResolveRentColor,
  onConfirmRent,
  onDismissRentDialog,
  wildcardDialog,
  onConfirmWildcard,
  onDismissWildcard,
  stealDialog,
  onConfirmStealProperty,
  onConfirmStealSet,
  onDismissStealDialog,
  forcedDealDialog,
  onConfirmForcedDeal,
  onDismissForcedDeal,
  houseHotelDialog,
  onConfirmHouseHotel,
  onDismissHouseHotel,
  justSayNoDialog,
  onUseJustSayNo,
  onAllowAction,
  pendingBurn,
  onReshuffleDeck,
  playerHand,
}: GameTableProps) {
  const [logOpen, setLogOpen] = useState(false);
  const [handCollapsed, setHandCollapsed] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showLastPlayed, setShowLastPlayed] = useState(false);

  const currentPlayer = gameState.players.find(
    (p) => p.id === gameState.currentPlayerId,
  );
  const tableOpponents = gameState.players.filter(
    (p) => p.id !== gameState.currentPlayerId,
  );
  const isPlayerTurn =
    gameState.currentPlayerId === gameState.currentTurnPlayerId;

  return (
    <div className="flex h-dvh flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <header className="shrink-0 border-b-2 border-border bg-card">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xs font-bold text-foreground">M-Dee WA</h1>
            <span className="text-[9px] text-muted-foreground">#{roomId}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-full bg-secondary px-2 py-1">
              <Users
                className="h-3 w-3 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="text-[9px] font-bold text-muted-foreground">
                {gameState.players.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setLogOpen(true)}
              className="btn-3d btn-3d-ghost flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary-subtle"
              aria-label="Open move log"
            >
              <ScrollText className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowLeaveConfirm(true)}
              className="btn-3d btn-3d-danger flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive-subtle"
              aria-label="Leave room"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Scrollable middle */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="border-b border-border-dim bg-game-table shrink-0">
            <OpponentArea
              opponents={tableOpponents}
              currentTurnPlayerId={gameState.currentTurnPlayerId}
            />
          </div>
          <div className="border-b border-border bg-card shrink-0">
            <PlayArea
              playAreaCard={gameState.playAreaCard}
              actionsRemaining={gameState.actionsRemaining}
              turnCount={gameState.turnCount}
              isPlayerTurn={isPlayerTurn}
              deckCount={gameState.deck.length}
              middlePileCount={gameState.middlePile.length}
              onViewMiddle={() => setShowLastPlayed(true)}
              onReshuffle={onReshuffleDeck}
            />
          </div>
          {currentPlayer && (
            <div className="border-b border-border shrink-0">
              <PlayerProperties
                propertySets={currentPlayer.propertySets}
                bankTotal={currentPlayer.bankTotal}
              />
            </div>
          )}
        </div>
      </div>

      {/* Player Hand */}
      <div className="shrink-0 border-t-2 border-border bg-card">
        {!handCollapsed && (
          <PlayerHand
            cards={gameState.hand}
            isPlayerTurn={isPlayerTurn}
            actionsRemaining={gameState.actionsRemaining}
            opponents={tableOpponents}
            pendingBurn={pendingBurn}
            onPlayCard={onPlayCard}
            onBankCard={onBankCard}
            onEndTurn={onEndTurn}
            onRotateTurn={onRotateTurn}
            onBurnCards={onBurnCards}
            onCollapse={() => setHandCollapsed(true)}
          />
        )}
        {handCollapsed && (
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Your Hand
            </span>
            <button
              type="button"
              onClick={() => setHandCollapsed(false)}
              className="btn-3d btn-3d-ghost flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary-subtle"
              aria-label="Expand hand"
            >
              <ChevronDown className="h-4 w-4 rotate-180" />
            </button>
          </div>
        )}
      </div>

      {/* Move Log */}
      <MoveLog
        entries={gameState.moveLog}
        isOpen={logOpen}
        onClose={() => setLogOpen(false)}
      />

      {/* Rent Dialog */}
      {rentDialog.open && (
        <RentDialog
          availableColors={rentDialog.availableColors}
          opponents={opponents}
          rentAmount={rentAmount}
          isWildRent={rentDialog.isWildRent}
          playerHand={playerHand}
          actionsRemaining={gameState.actionsRemaining}
          onResolveColor={onResolveRentColor}
          onConfirm={onConfirmRent}
          onCancel={onDismissRentDialog}
        />
      )}

      {wildcardDialog.open && wildcardDialog.cardId && (
        <WildcardDialog
          availableColors={wildcardDialog.availableColors}
          onConfirm={(color) => onConfirmWildcard(wildcardDialog.cardId!, color)}
          onCancel={onDismissWildcard}
        />
      )}

      {stealDialog.open && stealDialog.cardId && stealDialog.mode && (
        <StealDialog
          opponents={tableOpponents}
          mode={stealDialog.mode}
          cardName={gameState.hand.find(c => c.id === stealDialog.cardId)?.name || "Action Card"}
          onConfirmProperty={onConfirmStealProperty}
          onConfirmSet={onConfirmStealSet}
          onCancel={onDismissStealDialog}
        />
      )}

      {forcedDealDialog.open && forcedDealDialog.cardId && currentPlayer && (
        <ForcedDealDialog
          currentPlayer={currentPlayer}
          opponents={tableOpponents}
          onConfirm={onConfirmForcedDeal}
          onCancel={onDismissForcedDeal}
        />
      )}

      {houseHotelDialog.open && houseHotelDialog.type && currentPlayer && (
        <HouseHotelDialog
          type={houseHotelDialog.type}
          completeSets={currentPlayer.propertySets.filter((s) => s.isComplete)}
          onConfirm={onConfirmHouseHotel}
          onCancel={onDismissHouseHotel}
        />
      )}

      {justSayNoDialog.open && (
        <JustSayNoDialog
          attackerName={justSayNoDialog.attackerName}
          actionDescription={justSayNoDialog.actionDescription}
          onUseJustSayNo={onUseJustSayNo}
          onAllow={onAllowAction}
        />
      )}

      {showLastPlayed && (
        <LastPlayedDialog
          cards={gameState.middlePile}
          onClose={() => setShowLastPlayed(false)}
        />
      )}

      {/* Leave Confirmation */}
      {showLeaveConfirm && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setShowLeaveConfirm(false)}
            aria-hidden="true"
          />
          <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-xs rounded-3xl border-2 border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive-subtle">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Leave Room?</h3>
            </div>
            <p className="text-[10px] text-muted-foreground mb-5">
              You'll be removed from the game and won't be able to rejoin this
              session.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowLeaveConfirm(false)}
                className="btn-3d btn-3d-ghost flex flex-1 h-10 items-center justify-center rounded-xl bg-secondary text-foreground font-semibold text-sm"
              >
                Nah
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLeaveConfirm(false);
                  onLeave();
                }}
                className="btn-3d btn-3d-danger flex flex-1 h-10 items-center justify-center rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm"
              >
                Yeah
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
