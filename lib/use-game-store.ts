import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import {
  type GameCard,
  type GameState,
  type Player,
  type PropertyCard,
  type PropertySet,
  type MoveLogEntry,
  type CardColor,
  type ActionCard,
  isPropertyCard,
  isActionCard,
  isMoneyCard,
  isRentCard,
  isPropertyWildcard,
  isWildRentCard,
} from "./game-types";

export type ActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export interface RentDialogState {
  open: boolean;
  cardId: string | null;
  availableColors: CardColor[];
  resolvedColor: CardColor | null;
  targetPlayerIds: string[];
  isWildRent: boolean;
}

interface StealDialogState {
  open: boolean;
  mode: "property" | "set" | null;
  cardId: string | null;
  targetPlayerId: string | null;
}

interface ForcedDealDialogState {
  open: boolean;
  cardId: string | null;
}

interface HouseHotelDialogState {
  open: boolean;
  cardId: string | null;
  type: "house" | "hotel" | null;
}

interface JustSayNoDialogState {
  open: boolean;
  attackerName: string;
  actionDescription: string;
  pendingAction: (() => void) | null;
}

const INITIAL_RENT_DIALOG: RentDialogState = {
  open: false,
  cardId: null,
  availableColors: [],
  resolvedColor: null,
  targetPlayerIds: [],
  isWildRent: false,
};

interface GameStore extends GameState {
  selectedCardId: string | null;
  rentDialog: RentDialogState;
  stealDialog: StealDialogState;
  forcedDealDialog: ForcedDealDialogState;
  wildcardDialog: {
    open: boolean;
    cardId: string | null;
    availableColors: CardColor[];
  };
  houseHotelDialog: HouseHotelDialogState;
  justSayNoDialog: JustSayNoDialogState;
  pendingActionResult: ActionResult | null;
  pendingBurn: boolean;
  winner: string | null;
  setsToWin: number;

  selectCard: (cardId: string | null) => void;
  clearPendingResult: () => void;
  applyServerState: (state: any) => void;
}

export const useGameStore = create<GameStore>()(
  immer(
    (set, get) =>
      ({
        players: [],
        currentPlayerId: "",
        hand: [],
        turnCount: 1,
        currentTurnPlayerId: "",
        actionsRemaining: 3,
        playAreaCard: null,
        moveLog: [],
        deck: [],
        discardPile: [],
        middlePile: [],
        selectedCardId: null,
        rentDialog: INITIAL_RENT_DIALOG,
        stealDialog: {
          open: false,
          mode: null,
          cardId: null,
          targetPlayerId: null,
        },
        forcedDealDialog: {
          open: false,
          cardId: null,
        },
        wildcardDialog: { open: false, cardId: null, availableColors: [] },
        houseHotelDialog: { open: false, cardId: null, type: null },
        justSayNoDialog: {
          open: false,
          attackerName: "",
          actionDescription: "",
          pendingAction: null,
        },
        pendingActionResult: null,
        pendingBurn: false,
        winner: null,
        setsToWin: 3,

        selectCard: (cardId: string | null) => {
          set((state) => {
            state.selectedCardId = cardId;
          });
        },

        clearPendingResult: () => {
          set((s) => {
            s.pendingActionResult = null;
          });
        },

        applyServerState: (serverState: any) => {
          set((s) => {
            s.players = serverState.players ?? s.players;
            s.currentPlayerId = serverState.currentPlayerId ?? s.currentPlayerId;
            s.hand = serverState.hand ?? s.hand;
            s.turnCount = serverState.turnCount ?? s.turnCount;
            s.currentTurnPlayerId = serverState.currentTurnPlayerId ?? s.currentTurnPlayerId;
            s.actionsRemaining = serverState.actionsRemaining ?? s.actionsRemaining;
            s.playAreaCard = serverState.playAreaCard ?? null;
            s.moveLog = serverState.moveLog ?? s.moveLog;
            s.deck = serverState.deck ?? s.deck;
            s.discardPile = serverState.discardPile ?? s.discardPile;
            s.middlePile = serverState.middlePile ?? s.middlePile;
            s.winner = serverState.winner ?? null;
            s.setsToWin = serverState.setsToWin ?? s.setsToWin;
            s.pendingBurn = serverState.pendingBurn ?? false;
            s.selectedCardId = null;

            if (serverState.rentDialog) s.rentDialog = serverState.rentDialog;
            if (serverState.stealDialog) s.stealDialog = serverState.stealDialog;
            if (serverState.forcedDealDialog) s.forcedDealDialog = serverState.forcedDealDialog;
            if (serverState.wildcardDialog) s.wildcardDialog = serverState.wildcardDialog;
            if (serverState.houseHotelDialog) s.houseHotelDialog = serverState.houseHotelDialog;
            if (serverState.justSayNoDialog) s.justSayNoDialog = serverState.justSayNoDialog;
          });
        },
      }) as any,
  ),
);

export const selectHand = (s: GameStore) => s.hand;
export const selectActionsRemaining = (s: GameStore) => s.actionsRemaining;
export const selectIsMyTurn = (s: GameStore) =>
  s.currentPlayerId === s.currentTurnPlayerId;
export const selectCurrentPlayer = (s: GameStore) =>
  s.players.find((p) => p.id === s.currentPlayerId);
export const selectOpponents = (s: GameStore) =>
  s.players.filter((p) => p.id !== s.currentPlayerId);
export const selectMoveLog = (s: GameStore) => s.moveLog;
export const selectRentDialog = (s: GameStore) => s.rentDialog;
