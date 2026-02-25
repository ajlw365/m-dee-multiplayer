export type CardColor =
  | "darkblue"
  | "lightblue"
  | "brown"
  | "green"
  | "utility"
  | "red"
  | "yellow"
  | "orange"
  | "pink"
  | "railroad"
  | "purple"
  | "all";

export interface RentEntry {
  cards: number;
  rent: number;
}

export interface PropertyCard {
  id: string;
  name: string;
  color: CardColor;
  value: number;
  rentTable: RentEntry[];
  setRequired?: number;
  requiredCount?: number;
}

export interface ActionCard {
  id: string;
  name: string;
  type: "action";
  action?: string;
  description?: string;
  value: number;
  /** Whether this card targets a specific player */
  targetPlayer?: boolean;
}

export interface MoneyCard {
  id: string;
  name: string;
  type: "money";
  value: number;
}

export interface RentCard {
  id: string;
  name: string;
  type: "rent";
  /** Which color sets this rent card applies to (2 or "wild" for all) */
  colors: CardColor[] | "wild";
  value: number;
}

export interface PropertyWildcard {
  id: string;
  name: string;
  type: "wildcard" | "property-wild";
  /** The colors this wildcard can be placed in, or "multi" for rainbow */
  colors: CardColor[] | "multi";
  value: number;
  /** Rent profiles for two-color wildcards */
  rentProfiles?: Array<{
    color: CardColor;
    rentTable: RentEntry[];
  }>;
}

/** * Removed 'rule' card type.
 * GameCard is now limited to playable gameplay cards.
 */
export type GameCard =
  | PropertyCard
  | ActionCard
  | MoneyCard
  | RentCard
  | PropertyWildcard;

export interface PropertySet {
  color: CardColor;
  cards: PropertyCard[];
  isComplete: boolean;
  requiredCount: number;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  propertySets: PropertySet[];
  bankCards: MoneyCard[];
  bankTotal: number;
}

export interface MoveLogEntry {
  id: string;
  playerName: string;
  action: string;
  timestamp: string;
}

export interface GameState {
  players: Player[];
  currentPlayerId: string;
  hand: GameCard[];
  turnCount: number;
  currentTurnPlayerId: string;
  actionsRemaining: number;
  playAreaCard: GameCard | null;
  moveLog: MoveLogEntry[];
  deck: GameCard[];
  discardPile: GameCard[];
  middlePile: GameCard[];
}

/* --- TYPE GUARDS --- */

export function isPropertyCard(card: GameCard): card is PropertyCard {
  return !("type" in card) || (card as any).type === "property";
}

export function isActionCard(card: GameCard): card is ActionCard {
  return "type" in card && card.type === "action";
}

export function isMoneyCard(card: GameCard): card is MoneyCard {
  return "type" in card && card.type === "money";
}

export function isRentCard(card: GameCard): card is RentCard {
  return "type" in card && card.type === "rent";
}

export function isWildRentCard(card: RentCard): boolean {
  return (
    card.colors === "wild" ||
    (Array.isArray(card.colors) &&
      card.colors.length === 1 &&
      card.colors[0] === "all")
  );
}

export function isPropertyWildcard(card: GameCard): card is PropertyWildcard {
  return (
    "type" in card &&
    (card.type === "wildcard" || (card as any).type === "property-wild")
  );
}
