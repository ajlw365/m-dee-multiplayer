import type { GameCard, GameState, Player, MoveLogEntry } from "./game-types"

const mockHand: GameCard[] = [
  {
    id: "c1", name: "COTTESLOE", color: "darkblue", value: 4,
    rentTable: [{ cards: 1, rent: 3 }, { cards: 2, rent: 8 }], setRequired: 2,
  },
  {
    id: "c2", name: "ARMADALE", color: "brown", value: 1,
    rentTable: [{ cards: 1, rent: 1 }, { cards: 2, rent: 2 }], setRequired: 2,
  },
  { id: "c3", name: "DEBT COLLECTOR", type: "action", description: "Force any player to pay you $5M", value: 3, targetPlayer: true },
  { id: "c4", name: "PASS GO", type: "action", description: "Draw 2 cards from the deck", value: 1 },
  {
    id: "c5", name: "SCARBOROUGH", color: "lightblue", value: 2,
    rentTable: [{ cards: 1, rent: 1 }, { cards: 2, rent: 2 }, { cards: 3, rent: 4 }], setRequired: 3,
  },
  { id: "c6", name: "SLY DEAL", type: "action", description: "Steal a property from any player (not from a full set)", value: 3, targetPlayer: true },
  { id: "c7", name: "DEAL BREAKER", type: "action", description: "Steal a complete set from any player", value: 5, targetPlayer: true },
  { id: "c8", name: "$5M", type: "money", value: 5 },
  { id: "c9", name: "RENT", type: "rent", colors: ["darkblue", "green"], value: 1 },
  {
    id: "c10", name: "PERTH STATION", color: "railroad", value: 2,
    rentTable: [{ cards: 1, rent: 1 }, { cards: 2, rent: 2 }, { cards: 3, rent: 3 }, { cards: 4, rent: 4 }], setRequired: 4,
  },
  { id: "c11", name: "WILD RENT", type: "rent", colors: "wild", value: 3 },
  { id: "c12", name: "IT'S MY BIRTHDAY", type: "action", description: "All players pay you $2M", value: 2 },
  { id: "c13", name: "JUST SAY NO", type: "action", description: "Cancel any action card played against you", value: 4 },
  { id: "c14", name: "FORCED DEAL", type: "action", description: "Swap a property with any player", value: 3, targetPlayer: true },
  {
    id: "c15", name: "VICTORIA PARK", color: "pink", value: 2,
    rentTable: [{ cards: 1, rent: 1 }, { cards: 2, rent: 2 }, { cards: 3, rent: 4 }], setRequired: 3,
  },
  { id: "c16", name: "HOUSE", type: "action", description: "Add to a full set. +3M rent", value: 3 },
  { id: "c17", name: "HOTEL", type: "action", description: "Add to a set with a house. +4M rent", value: 4 },
  { id: "c18", name: "DOUBLE THE RENT", type: "action", description: "Play with a rent card to double it", value: 1 },
  { id: "c19", name: "DB/GR WILD", type: "wildcard", colors: ["darkblue", "green"], value: 0 },
  { id: "c20", name: "RAINBOW WILD", type: "wildcard", colors: "multi", value: 0 },
]

const mockPlayers: Player[] = [
  {
    id: "p1",
    name: "You",
    avatar: "Y",
    propertySets: [
      {
        color: "darkblue",
        cards: [
          {
            id: "ps1", name: "ST GEORGES TCE", color: "darkblue", value: 4,
            rentTable: [{ cards: 1, rent: 3 }, { cards: 2, rent: 8 }], setRequired: 2,
          },
          {
            id: "ps1b", name: "KINGS PARK", color: "darkblue", value: 4,
            rentTable: [{ cards: 1, rent: 3 }, { cards: 2, rent: 8 }], setRequired: 2,
          },
          {
            id: "ps1h", name: "HOUSE", type: "action", description: "Add to a full set. +3M rent", value: 3,
          },
          {
            id: "ps1l", name: "HOTEL", type: "action", description: "Add to a set with a house. +4M rent", value: 4,
          },
        ],
        isComplete: true,
        requiredCount: 2,
      },
      {
        color: "lightblue",
        cards: [
          {
            id: "ps2", name: "FREMANTLE", color: "lightblue", value: 2,
            rentTable: [{ cards: 1, rent: 1 }, { cards: 2, rent: 2 }, { cards: 3, rent: 4 }], setRequired: 3,
          },
          {
            id: "ps3", name: "COTTESLOE", color: "lightblue", value: 2,
            rentTable: [{ cards: 1, rent: 1 }, { cards: 2, rent: 2 }, { cards: 3, rent: 4 }], setRequired: 3,
          },
        ],
        isComplete: false,
        requiredCount: 3,
      },
      {
        color: "railroad",
        cards: [
          {
            id: "ps20", name: "PERTH STATION", color: "railroad", value: 2,
            rentTable: [{ cards: 1, rent: 1 }, { cards: 2, rent: 2 }, { cards: 3, rent: 3 }, { cards: 4, rent: 4 }], setRequired: 4,
          },
          {
            id: "ps21", name: "JOONDALUP STN", color: "railroad", value: 2,
            rentTable: [{ cards: 1, rent: 1 }, { cards: 2, rent: 2 }, { cards: 3, rent: 3 }, { cards: 4, rent: 4 }], setRequired: 4,
          },
        ],
        isComplete: false,
        requiredCount: 4,
      },
      {
        color: "red",
        cards: [
          {
            id: "ps22", name: "NORTHBRIDGE", color: "red", value: 3,
            rentTable: [{ cards: 1, rent: 1 }, { cards: 2, rent: 3 }, { cards: 3, rent: 6 }], setRequired: 3,
          },
        ],
        isComplete: false,
        requiredCount: 3,
      },
    ],
    bankCards: [
      { id: "b1", name: "$1M", type: "money", value: 1 },
      { id: "b2", name: "$3M", type: "money", value: 3 },
      { id: "b3", name: "$5M", type: "money", value: 5 },
    ],
    bankTotal: 9,
  },
  {
    id: "p2",
    name: "Alice",
    avatar: "A",
    propertySets: [
      {
        color: "green",
        cards: [
          {
            id: "ps4", name: "ESPERANCE", color: "green", value: 2,
            rentTable: [{ cards: 1, rent: 1 }, { cards: 2, rent: 3 }, { cards: 3, rent: 6 }], setRequired: 3,
          },
          {
            id: "ps5", name: "MARGARET RIVER", color: "green", value: 2,
            rentTable: [{ cards: 1, rent: 1 }, { cards: 2, rent: 3 }, { cards: 3, rent: 6 }], setRequired: 3,
          },
          {
            id: "ps6", name: "ALBANY", color: "green", value: 2,
            rentTable: [{ cards: 1, rent: 1 }, { cards: 2, rent: 3 }, { cards: 3, rent: 6 }], setRequired: 3,
          },
        ],
        isComplete: true,
        requiredCount: 3,
      },
      {
        color: "pink",
        cards: [
          {
            id: "ps12", name: "VICTORIA PARK", color: "pink", value: 2,
            rentTable: [{ cards: 1, rent: 1 }, { cards: 2, rent: 2 }, { cards: 3, rent: 4 }], setRequired: 3,
          },
          {
            id: "ps13", name: "SUBIACO", color: "pink", value: 2,
            rentTable: [{ cards: 1, rent: 1 }, { cards: 2, rent: 2 }, { cards: 3, rent: 4 }], setRequired: 3,
          },
        ],
        isComplete: false,
        requiredCount: 3,
      },
    ],
    bankCards: [
      { id: "b4", name: "$2M", type: "money", value: 2 },
      { id: "b5", name: "$4M", type: "money", value: 4 },
    ],
    bankTotal: 6,
  },
  {
    id: "p3",
    name: "Bob",
    avatar: "B",
    propertySets: [
      {
        color: "brown",
        cards: [
          {
            id: "ps7", name: "ARMADALE", color: "brown", value: 1,
            rentTable: [{ cards: 1, rent: 1 }, { cards: 2, rent: 2 }], setRequired: 2,
          },
          {
            id: "ps8", name: "MIDLAND", color: "brown", value: 1,
            rentTable: [{ cards: 1, rent: 1 }, { cards: 2, rent: 2 }], setRequired: 2,
          },
        ],
        isComplete: true,
        requiredCount: 2,
      },
      {
        color: "orange",
        cards: [
          {
            id: "ps14", name: "MANDURAH", color: "orange", value: 2,
            rentTable: [{ cards: 1, rent: 1 }, { cards: 2, rent: 3 }, { cards: 3, rent: 5 }], setRequired: 3,
          },
        ],
        isComplete: false,
        requiredCount: 3,
      },
    ],
    bankCards: [
      { id: "b6", name: "$1M", type: "money", value: 1 },
    ],
    bankTotal: 1,
  },
  {
    id: "p4",
    name: "Carol",
    avatar: "C",
    propertySets: [
      {
        color: "utility",
        cards: [
          {
            id: "ps24", name: "WESTERN POWER", color: "utility", value: 1,
            rentTable: [{ cards: 1, rent: 1 }, { cards: 2, rent: 2 }], setRequired: 2,
          },
        ],
        isComplete: false,
        requiredCount: 2,
      },
      {
        color: "yellow",
        cards: [
          {
            id: "ps25", name: "PERTH CBD", color: "yellow", value: 3,
            rentTable: [{ cards: 1, rent: 2 }, { cards: 2, rent: 4 }, { cards: 3, rent: 6 }], setRequired: 3,
          },
          {
            id: "ps26", name: "CITY BEACH", color: "yellow", value: 3,
            rentTable: [{ cards: 1, rent: 2 }, { cards: 2, rent: 4 }, { cards: 3, rent: 6 }], setRequired: 3,
          },
        ],
        isComplete: false,
        requiredCount: 3,
      },
    ],
    bankCards: [
      { id: "b7", name: "$2M", type: "money", value: 2 },
      { id: "b8", name: "$3M", type: "money", value: 3 },
    ],
    bankTotal: 5,
  },
]

const mockMoveLog: MoveLogEntry[] = [
  { id: "m1", playerName: "Alice", action: "played Collect Rent on Green", timestamp: "2 min ago" },
  { id: "m2", playerName: "Bob", action: "added Midland to Brown set", timestamp: "3 min ago" },
  { id: "m3", playerName: "You", action: "banked $3M", timestamp: "4 min ago" },
  { id: "m4", playerName: "Alice", action: "played Pass Go, drew 2 cards", timestamp: "5 min ago" },
  { id: "m5", playerName: "Bob", action: "played Say No to Alice", timestamp: "6 min ago" },
  { id: "m6", playerName: "You", action: "added Fremantle to Light Blue set", timestamp: "7 min ago" },
  { id: "m7", playerName: "Alice", action: "banked $2M", timestamp: "8 min ago" },
  { id: "m8", playerName: "Bob", action: "played Debt Collector on You", timestamp: "9 min ago" },
]

export const mockGameState: GameState = {
  players: mockPlayers,
  currentPlayerId: "p1",
  hand: mockHand,
  turnCount: 7,
  currentTurnPlayerId: "p1",
  actionsRemaining: 2,
  playAreaCard: {
    id: "play1",
    name: "PASS GO",
    type: "action",
    description: "Draw 2 cards from the deck",
    value: 1,
  },
  moveLog: mockMoveLog,
}
