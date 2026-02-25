import express from "express";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "5000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

interface RoomPlayer {
  id: string;
  socketId: string;
  name: string;
  avatar: string;
  isHost: boolean;
}

interface RoomConfig {
  roomId: string;
  maxPlayers: number;
  setsToWin: number;
  hostSocketId: string;
}

interface Room {
  config: RoomConfig;
  players: RoomPlayer[];
  gameStarted: boolean;
  gameState: any | null;
}

const rooms = new Map<string, Room>();

function generatePlayerId(index: number): string {
  return `p${index + 1}`;
}

app.prepare().then(() => {
  const expressApp = express();
  const httpServer = createServer(expressApp);

  const io = new SocketServer(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    socket.on("create-room", (data: { roomId: string; playerName: string; maxPlayers: number; setsToWin: number }, callback) => {
      const { roomId, playerName, maxPlayers, setsToWin } = data;

      if (rooms.has(roomId)) {
        callback({ ok: false, error: "Room already exists" });
        return;
      }

      const player: RoomPlayer = {
        id: generatePlayerId(0),
        socketId: socket.id,
        name: playerName,
        avatar: playerName.charAt(0).toUpperCase(),
        isHost: true,
      };

      const room: Room = {
        config: { roomId, maxPlayers, setsToWin, hostSocketId: socket.id },
        players: [player],
        gameStarted: false,
        gameState: null,
      };

      rooms.set(roomId, room);
      socket.join(roomId);
      callback({ ok: true, playerId: player.id, players: room.players });
      console.log(`[Room] Created: ${roomId} by ${playerName}`);
    });

    socket.on("join-room", (data: { roomId: string; playerName: string }, callback) => {
      const { roomId, playerName } = data;
      const room = rooms.get(roomId);

      if (!room) {
        callback({ ok: false, error: "Room not found" });
        return;
      }
      if (room.gameStarted) {
        callback({ ok: false, error: "Game already in progress" });
        return;
      }
      if (room.players.length >= room.config.maxPlayers) {
        callback({ ok: false, error: "Room is full" });
        return;
      }
      if (room.players.some((p) => p.name === playerName)) {
        callback({ ok: false, error: "Name already taken" });
        return;
      }

      const player: RoomPlayer = {
        id: generatePlayerId(room.players.length),
        socketId: socket.id,
        name: playerName,
        avatar: playerName.charAt(0).toUpperCase(),
        isHost: false,
      };

      room.players.push(player);
      socket.join(roomId);
      callback({ ok: true, playerId: player.id, players: room.players });

      socket.to(roomId).emit("player-joined", { players: room.players });
      console.log(`[Room] ${playerName} joined ${roomId} (${room.players.length}/${room.config.maxPlayers})`);
    });

    socket.on("start-game", (data: { roomId: string }, callback) => {
      const room = rooms.get(data.roomId);
      if (!room) { callback({ ok: false, error: "Room not found" }); return; }
      if (room.config.hostSocketId !== socket.id) { callback({ ok: false, error: "Only the host can start" }); return; }
      if (room.players.length < 2) { callback({ ok: false, error: "Need at least 2 players" }); return; }

      room.gameStarted = true;
      const gameState = initializeGame(room);
      room.gameState = gameState;

      for (const player of room.players) {
        const playerSocket = io.sockets.sockets.get(player.socketId);
        if (playerSocket) {
          const personalState = buildPlayerView(gameState, player.id);
          playerSocket.emit("game-started", personalState);
        }
      }

      callback({ ok: true });
      console.log(`[Game] Started in room ${data.roomId}`);
    });

    socket.on("game-action", (data: { roomId: string; action: string; payload: any }, callback) => {
      const room = rooms.get(data.roomId);
      if (!room || !room.gameState) { callback({ ok: false, error: "No active game" }); return; }

      const player = room.players.find((p) => p.socketId === socket.id);
      if (!player) { callback({ ok: false, error: "Not in room" }); return; }

      const result = processGameAction(room, player.id, data.action, data.payload);
      callback(result);

      if (result.ok) {
        for (const p of room.players) {
          const pSocket = io.sockets.sockets.get(p.socketId);
          if (pSocket) {
            pSocket.emit("game-state-update", buildPlayerView(room.gameState, p.id));
          }
        }
      }
    });

    socket.on("leave-room", (data: { roomId: string }) => {
      handlePlayerLeave(socket, data.roomId, io);
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
      for (const [roomId, room] of rooms.entries()) {
        const player = room.players.find((p) => p.socketId === socket.id);
        if (player) {
          handlePlayerLeave(socket, roomId, io);
          break;
        }
      }
    });
  });

  expressApp.all("/{*path}", (req: any, res: any) => handle(req, res));

  httpServer.listen(port, hostname, () => {
    console.log(`> Server ready on http://${hostname}:${port}`);
  });
});

function handlePlayerLeave(socket: any, roomId: string, io: SocketServer) {
  const room = rooms.get(roomId);
  if (!room) return;

  const leavingPlayer = room.players.find((p) => p.socketId === socket.id);
  if (!leavingPlayer) return;

  room.players = room.players.filter((p) => p.socketId !== socket.id);
  socket.leave(roomId);

  if (room.players.length === 0) {
    rooms.delete(roomId);
    console.log(`[Room] Deleted empty room: ${roomId}`);
    return;
  }

  if (leavingPlayer.isHost && room.players.length > 0) {
    room.players[0].isHost = true;
    room.config.hostSocketId = room.players[0].socketId;
  }

  io.to(roomId).emit("player-left", {
    playerName: leavingPlayer.name,
    players: room.players,
  });

  if (room.gameStarted && room.gameState) {
    room.gameState.moveLog.unshift({
      id: `m-${Date.now()}`,
      playerName: "System",
      action: `${leavingPlayer.name} left the game`,
      timestamp: "Just now",
    });

    for (const p of room.players) {
      const pSocket = io.sockets.sockets.get(p.socketId);
      if (pSocket) {
        pSocket.emit("game-state-update", buildPlayerView(room.gameState, p.id));
      }
    }
  }

  console.log(`[Room] ${leavingPlayer.name} left ${roomId}`);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function initializeGame(room: Room): any {
  const waDeck = require("./lib/wa-deck.json");
  const deck = shuffle([...waDeck]);
  const hands: Record<string, any[]> = {};
  const players: any[] = [];

  for (const rp of room.players) {
    hands[rp.id] = deck.splice(0, 5);
    players.push({
      id: rp.id,
      name: rp.name,
      avatar: rp.avatar,
      propertySets: [],
      bankCards: [],
      bankTotal: 0,
    });
  }

  const firstPlayerId = room.players[0].id;
  const startDraw = deck.splice(0, 2);
  hands[firstPlayerId] = [...hands[firstPlayerId], ...startDraw];

  return {
    players,
    hands,
    deck,
    discardPile: [],
    middlePile: [],
    currentTurnPlayerId: firstPlayerId,
    actionsRemaining: 3,
    turnCount: 1,
    playAreaCard: null,
    setsToWin: room.config.setsToWin,
    winner: null,
    pendingBurn: false,
    rentDialog: { open: false, cardId: null, availableColors: [], resolvedColor: null, targetPlayerIds: [], isWildRent: false },
    stealDialog: { open: false, mode: null, cardId: null, targetPlayerId: null },
    forcedDealDialog: { open: false, cardId: null },
    wildcardDialog: { open: false, cardId: null, availableColors: [] },
    houseHotelDialog: { open: false, cardId: null, type: null },
    justSayNoDialog: { open: false, attackerName: "", actionDescription: "", pendingAction: null },
    moveLog: [{ id: `m-${Date.now()}`, playerName: "System", action: "Game started – deal complete", timestamp: "Just now" }],
  };
}

function buildPlayerView(gameState: any, playerId: string): any {
  return {
    players: gameState.players,
    currentPlayerId: playerId,
    hand: gameState.hands[playerId] || [],
    turnCount: gameState.turnCount,
    currentTurnPlayerId: gameState.currentTurnPlayerId,
    actionsRemaining: gameState.actionsRemaining,
    playAreaCard: gameState.playAreaCard,
    moveLog: gameState.moveLog,
    deck: gameState.deck,
    discardPile: gameState.discardPile,
    middlePile: gameState.middlePile,
    winner: gameState.winner,
    pendingBurn: gameState.pendingBurn && gameState.currentTurnPlayerId === playerId,
    rentDialog: gameState.rentDialog.open && gameState.currentTurnPlayerId === playerId ? gameState.rentDialog : { open: false, cardId: null, availableColors: [], resolvedColor: null, targetPlayerIds: [], isWildRent: false },
    stealDialog: gameState.stealDialog.open && gameState.currentTurnPlayerId === playerId ? gameState.stealDialog : { open: false, mode: null, cardId: null, targetPlayerId: null },
    forcedDealDialog: gameState.forcedDealDialog.open && gameState.currentTurnPlayerId === playerId ? gameState.forcedDealDialog : { open: false, cardId: null },
    wildcardDialog: gameState.wildcardDialog.open && gameState.currentTurnPlayerId === playerId ? gameState.wildcardDialog : { open: false, cardId: null, availableColors: [] },
    houseHotelDialog: gameState.houseHotelDialog.open && gameState.currentTurnPlayerId === playerId ? gameState.houseHotelDialog : { open: false, cardId: null, type: null },
    justSayNoDialog: gameState.justSayNoDialog,
    setsToWin: gameState.setsToWin,
  };
}

const DEFAULT_SET_PROPS: Record<string, { rentTable: { cards: number; rent: number }[]; setRequired: number }> = {
  darkblue: { setRequired: 2, rentTable: [{ cards: 1, rent: 3 }, { cards: 2, rent: 8 }] },
  brown: { setRequired: 2, rentTable: [{ cards: 1, rent: 1 }, { cards: 2, rent: 2 }] },
  lightblue: { setRequired: 3, rentTable: [{ cards: 1, rent: 1 }, { cards: 2, rent: 2 }, { cards: 3, rent: 3 }] },
  pink: { setRequired: 3, rentTable: [{ cards: 1, rent: 1 }, { cards: 2, rent: 2 }, { cards: 3, rent: 4 }] },
  orange: { setRequired: 3, rentTable: [{ cards: 1, rent: 1 }, { cards: 2, rent: 3 }, { cards: 3, rent: 5 }] },
  red: { setRequired: 3, rentTable: [{ cards: 1, rent: 2 }, { cards: 2, rent: 3 }, { cards: 3, rent: 6 }] },
  yellow: { setRequired: 3, rentTable: [{ cards: 1, rent: 2 }, { cards: 2, rent: 4 }, { cards: 3, rent: 6 }] },
  green: { setRequired: 3, rentTable: [{ cards: 1, rent: 2 }, { cards: 2, rent: 4 }, { cards: 3, rent: 7 }] },
  railroad: { setRequired: 4, rentTable: [{ cards: 1, rent: 1 }, { cards: 2, rent: 2 }, { cards: 3, rent: 3 }, { cards: 4, rent: 4 }] },
  utility: { setRequired: 2, rentTable: [{ cards: 1, rent: 1 }, { cards: 2, rent: 2 }] },
  purple: { setRequired: 3, rentTable: [{ cards: 1, rent: 1 }, { cards: 2, rent: 2 }, { cards: 3, rent: 4 }] },
  all: { setRequired: 2, rentTable: [] },
};

const VALID_COLORS = ["darkblue", "lightblue", "brown", "green", "utility", "red", "yellow", "orange", "pink", "railroad", "purple"];

function isPropertyCard(card: any): boolean {
  return !("type" in card) || card.type === "property";
}

function isActionCard(card: any): boolean {
  return card.type === "action";
}

function isMoneyCard(card: any): boolean {
  return card.type === "money";
}

function isRentCard(card: any): boolean {
  return card.type === "rent";
}

function isWildRentCard(card: any): boolean {
  return card.colors === "wild" || (Array.isArray(card.colors) && card.colors.length === 1 && card.colors[0] === "all");
}

function isPropertyWildcard(card: any): boolean {
  return card.type === "wildcard" || card.type === "property-wild";
}

function addCardToPropertySets(sets: any[], card: any): any[] {
  const required = card.requiredCount ?? card.setRequired ?? DEFAULT_SET_PROPS[card.color]?.setRequired ?? 2;
  const existingIndex = sets.findIndex((s: any) => s.color === card.color && !s.isComplete);

  if (existingIndex >= 0) {
    const existing = sets[existingIndex];
    if (existing.cards.some((c: any) => c.id === card.id)) return sets;
    const updatedCards = [...existing.cards, card];
    return sets.map((s: any, idx: number) =>
      idx === existingIndex
        ? { ...s, cards: updatedCards, isComplete: updatedCards.length >= s.requiredCount }
        : s
    );
  }

  return [...sets, { color: card.color, cards: [card], isComplete: 1 >= required, requiredCount: required }];
}

function calculateRentForSet(player: any, color: string): number {
  const set = player.propertySets.find((s: any) => s.color === color);
  if (!set || set.cards.length === 0) return 0;
  const propCard = set.cards.find((c: any) => "rentTable" in c);
  const rentTable = propCard?.rentTable ?? DEFAULT_SET_PROPS[color]?.rentTable;
  if (!rentTable || rentTable.length === 0) return 0;
  const sorted = [...rentTable].sort((a: any, b: any) => b.cards - a.cards);
  return sorted.find((r: any) => set.cards.length >= r.cards)?.rent ?? 0;
}

function checkWin(players: any[], playerId: string, threshold: number): string | null {
  const player = players.find((p: any) => p.id === playerId);
  if (!player) return null;
  const completeSets = player.propertySets.filter((s: any) => s.cards.length >= s.requiredCount).length;
  return completeSets >= threshold ? player.name : null;
}

function logEntry(playerName: string, action: string) {
  return {
    id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    playerName,
    action,
    timestamp: "Just now",
  };
}

function processGameAction(room: Room, playerId: string, action: string, payload: any): any {
  const gs = room.gameState;
  if (!gs) return { ok: false, error: "No game state" };

  const playerIdx = gs.players.findIndex((p: any) => p.id === playerId);
  if (playerIdx < 0) return { ok: false, error: "Player not found" };
  const player = gs.players[playerIdx];
  const hand = gs.hands[playerId] || [];

  switch (action) {
    case "play-card": {
      if (gs.currentTurnPlayerId !== playerId) return { ok: false, message: "Not your turn" };
      if (gs.actionsRemaining <= 0) return { ok: false, message: "No actions remaining" };
      const cardId = payload.cardId;
      const cardIndex = hand.findIndex((c: any) => c.id === cardId);
      if (cardIndex < 0) return { ok: false, message: "Card not in hand" };
      const card = hand[cardIndex];

      if (isPropertyCard(card) || isPropertyWildcard(card)) {
        return handlePlayProperty(gs, playerId, cardId);
      }
      if (isRentCard(card)) {
        return handlePlayRent(gs, playerId, cardId);
      }
      if (isMoneyCard(card)) {
        return { ok: false, message: "Money cards must be banked, not played" };
      }
      if (isActionCard(card)) {
        return handlePlayAction(gs, playerId, cardId, payload.targetPlayerId);
      }
      return { ok: false, message: "Unknown card type" };
    }

    case "bank-card": {
      if (gs.currentTurnPlayerId !== playerId) return { ok: false, message: "Not your turn" };
      if (gs.actionsRemaining <= 0) return { ok: false, message: "No actions remaining" };
      const cardId = payload.cardId;
      const cardIndex = hand.findIndex((c: any) => c.id === cardId);
      if (cardIndex < 0) return { ok: false, message: "Card not in hand" };
      const card = hand[cardIndex];

      gs.hands[playerId].splice(cardIndex, 1);
      player.bankCards.push(card);
      player.bankTotal += card.value;
      gs.actionsRemaining -= 1;
      gs.playAreaCard = card;
      gs.moveLog.unshift(logEntry(player.name, `banked ${card.name} ($${card.value}M)`));

      if (gs.actionsRemaining === 0) {
        handleEndTurn(gs, playerId);
      }
      return { ok: true, message: `Banked ${card.name}` };
    }

    case "play-property": {
      return handlePlayProperty(gs, playerId, payload.cardId);
    }

    case "resolve-rent-color": {
      if (!gs.rentDialog.open) return { ok: false, message: "No rent dialog open" };
      gs.rentDialog.resolvedColor = payload.color;
      return { ok: true, message: "Color selected" };
    }

    case "confirm-rent": {
      if (!gs.rentDialog.open || !gs.rentDialog.resolvedColor) return { ok: false, message: "Select a color first" };
      const color = gs.rentDialog.resolvedColor;
      const rentAmount = calculateRentForSet(player, color);
      const targetIds = payload.targetPlayerIds || gs.players.filter((p: any) => p.id !== playerId).map((p: any) => p.id);

      for (const tid of targetIds) {
        const target = gs.players.find((p: any) => p.id === tid);
        if (target) {
          const paid = Math.min(rentAmount, target.bankTotal);
          target.bankTotal -= paid;
          player.bankTotal += paid;
        }
      }

      const cardId = gs.rentDialog.cardId;
      const cardIndex = gs.hands[playerId].findIndex((c: any) => c.id === cardId);
      if (cardIndex >= 0) {
        const card = gs.hands[playerId].splice(cardIndex, 1)[0];
        gs.middlePile.push(card);
        gs.playAreaCard = card;
      }

      gs.actionsRemaining -= 1;
      gs.moveLog.unshift(logEntry(player.name, `charged $${rentAmount}M rent on ${color}`));
      gs.rentDialog = { open: false, cardId: null, availableColors: [], resolvedColor: null, targetPlayerIds: [], isWildRent: false };

      if (gs.actionsRemaining === 0) {
        handleEndTurn(gs, playerId);
      }
      return { ok: true, message: `Rent charged: $${rentAmount}M` };
    }

    case "dismiss-rent": {
      gs.rentDialog = { open: false, cardId: null, availableColors: [], resolvedColor: null, targetPlayerIds: [], isWildRent: false };
      return { ok: true, message: "Dismissed" };
    }

    case "confirm-wildcard": {
      if (!gs.wildcardDialog.open) return { ok: false, message: "No wildcard dialog" };
      const cardId = gs.wildcardDialog.cardId;
      const chosenColor = payload.color;
      const cardIndex = gs.hands[playerId].findIndex((c: any) => c.id === cardId);
      if (cardIndex < 0) return { ok: false, message: "Card not found" };

      const card = gs.hands[playerId].splice(cardIndex, 1)[0];
      const defaults = DEFAULT_SET_PROPS[chosenColor] ?? { rentTable: [], setRequired: 2 };
      const fakeCard = {
        id: card.id,
        name: card.name,
        color: chosenColor,
        value: card.value,
        rentTable: defaults.rentTable,
        setRequired: defaults.setRequired,
        _isWild: true,
        _originalColors: card.colors,
      };

      player.propertySets = addCardToPropertySets(player.propertySets, fakeCard);
      gs.actionsRemaining -= 1;
      gs.playAreaCard = card;
      gs.moveLog.unshift(logEntry(player.name, `played ${card.name} as ${chosenColor}`));
      gs.wildcardDialog = { open: false, cardId: null, availableColors: [] };

      const winner = checkWin(gs.players, playerId, gs.setsToWin);
      if (winner) {
        gs.winner = winner;
        gs.moveLog.unshift(logEntry(winner, "WON THE GAME!"));
      }

      if (gs.actionsRemaining === 0 && !gs.winner) {
        handleEndTurn(gs, playerId);
      }
      return { ok: true, message: `Played ${card.name} as ${chosenColor}` };
    }

    case "dismiss-wildcard": {
      gs.wildcardDialog = { open: false, cardId: null, availableColors: [] };
      return { ok: true, message: "Dismissed" };
    }

    case "confirm-steal-property": {
      if (!gs.stealDialog.open) return { ok: false, message: "No steal dialog" };
      const { targetPlayerId: targetId, propertyId } = payload;
      const actionCardId = gs.stealDialog.cardId;

      const target = gs.players.find((p: any) => p.id === targetId);
      if (!target) return { ok: false, message: "Target not found" };

      let stolenCard: any = null;
      for (const set of target.propertySets) {
        const idx = set.cards.findIndex((c: any) => c.id === propertyId);
        if (idx >= 0) {
          stolenCard = set.cards.splice(idx, 1)[0];
          set.isComplete = set.cards.length >= set.requiredCount;
          break;
        }
      }
      target.propertySets = target.propertySets.filter((s: any) => s.cards.length > 0);

      if (stolenCard) {
        player.propertySets = addCardToPropertySets(player.propertySets, stolenCard);
      }

      const acIdx = gs.hands[playerId].findIndex((c: any) => c.id === actionCardId);
      if (acIdx >= 0) {
        const ac = gs.hands[playerId].splice(acIdx, 1)[0];
        gs.middlePile.push(ac);
        gs.playAreaCard = ac;
      }

      gs.actionsRemaining -= 1;
      gs.moveLog.unshift(logEntry(player.name, `stole ${stolenCard?.name ?? "a property"} from ${target.name}`));
      gs.stealDialog = { open: false, mode: null, cardId: null, targetPlayerId: null };

      const winner = checkWin(gs.players, playerId, gs.setsToWin);
      if (winner) { gs.winner = winner; gs.moveLog.unshift(logEntry(winner, "WON THE GAME!")); }
      if (gs.actionsRemaining === 0 && !gs.winner) handleEndTurn(gs, playerId);
      return { ok: true, message: "Property stolen" };
    }

    case "confirm-steal-set": {
      if (!gs.stealDialog.open) return { ok: false, message: "No steal dialog" };
      const { targetPlayerId: targetId, color } = payload;
      const actionCardId = gs.stealDialog.cardId;
      const target = gs.players.find((p: any) => p.id === targetId);
      if (!target) return { ok: false, message: "Target not found" };

      const setIdx = target.propertySets.findIndex((s: any) => s.color === color);
      if (setIdx < 0) return { ok: false, message: "Set not found" };
      const stolenSet = target.propertySets.splice(setIdx, 1)[0];

      for (const card of stolenSet.cards) {
        player.propertySets = addCardToPropertySets(player.propertySets, card);
      }

      const acIdx = gs.hands[playerId].findIndex((c: any) => c.id === actionCardId);
      if (acIdx >= 0) {
        const ac = gs.hands[playerId].splice(acIdx, 1)[0];
        gs.middlePile.push(ac);
        gs.playAreaCard = ac;
      }

      gs.actionsRemaining -= 1;
      gs.moveLog.unshift(logEntry(player.name, `stole ${color} set from ${target.name}`));
      gs.stealDialog = { open: false, mode: null, cardId: null, targetPlayerId: null };

      const winner = checkWin(gs.players, playerId, gs.setsToWin);
      if (winner) { gs.winner = winner; gs.moveLog.unshift(logEntry(winner, "WON THE GAME!")); }
      if (gs.actionsRemaining === 0 && !gs.winner) handleEndTurn(gs, playerId);
      return { ok: true, message: "Set stolen" };
    }

    case "dismiss-steal": {
      gs.stealDialog = { open: false, mode: null, cardId: null, targetPlayerId: null };
      return { ok: true, message: "Dismissed" };
    }

    case "confirm-forced-deal": {
      if (!gs.forcedDealDialog.open) return { ok: false, message: "No forced deal dialog" };
      const { myPropertyId, mySetColor, targetPlayerId: targetId, targetPropertyId } = payload;
      const actionCardId = gs.forcedDealDialog.cardId;
      const target = gs.players.find((p: any) => p.id === targetId);
      if (!target) return { ok: false, message: "Target not found" };

      let myCard: any = null;
      const mySetIdx = player.propertySets.findIndex((s: any) => s.color === mySetColor);
      if (mySetIdx >= 0) {
        const idx = player.propertySets[mySetIdx].cards.findIndex((c: any) => c.id === myPropertyId);
        if (idx >= 0) {
          myCard = player.propertySets[mySetIdx].cards.splice(idx, 1)[0];
          player.propertySets[mySetIdx].isComplete = player.propertySets[mySetIdx].cards.length >= player.propertySets[mySetIdx].requiredCount;
        }
      }
      player.propertySets = player.propertySets.filter((s: any) => s.cards.length > 0);

      let theirCard: any = null;
      for (const set of target.propertySets) {
        const idx = set.cards.findIndex((c: any) => c.id === targetPropertyId);
        if (idx >= 0) {
          theirCard = set.cards.splice(idx, 1)[0];
          set.isComplete = set.cards.length >= set.requiredCount;
          break;
        }
      }
      target.propertySets = target.propertySets.filter((s: any) => s.cards.length > 0);

      if (myCard) target.propertySets = addCardToPropertySets(target.propertySets, myCard);
      if (theirCard) player.propertySets = addCardToPropertySets(player.propertySets, theirCard);

      const acIdx = gs.hands[playerId].findIndex((c: any) => c.id === actionCardId);
      if (acIdx >= 0) {
        const ac = gs.hands[playerId].splice(acIdx, 1)[0];
        gs.middlePile.push(ac);
        gs.playAreaCard = ac;
      }

      gs.actionsRemaining -= 1;
      gs.moveLog.unshift(logEntry(player.name, `forced deal with ${target.name}`));
      gs.forcedDealDialog = { open: false, cardId: null };

      const winner = checkWin(gs.players, playerId, gs.setsToWin);
      if (winner) { gs.winner = winner; gs.moveLog.unshift(logEntry(winner, "WON THE GAME!")); }
      if (gs.actionsRemaining === 0 && !gs.winner) handleEndTurn(gs, playerId);
      return { ok: true, message: "Forced deal complete" };
    }

    case "dismiss-forced-deal": {
      gs.forcedDealDialog = { open: false, cardId: null };
      return { ok: true, message: "Dismissed" };
    }

    case "confirm-house-hotel": {
      if (!gs.houseHotelDialog.open) return { ok: false, message: "No house/hotel dialog" };
      const color = payload.color;
      const cardId = gs.houseHotelDialog.cardId;

      const set = player.propertySets.find((s: any) => s.color === color && s.isComplete);
      if (!set) return { ok: false, message: "No complete set of that color" };

      const cardIndex = gs.hands[playerId].findIndex((c: any) => c.id === cardId);
      if (cardIndex < 0) return { ok: false, message: "Card not found" };
      const card = gs.hands[playerId].splice(cardIndex, 1)[0];

      set.cards.push({ ...card, color });
      gs.actionsRemaining -= 1;
      gs.playAreaCard = card;
      gs.moveLog.unshift(logEntry(player.name, `placed ${card.name} on ${color} set`));
      gs.houseHotelDialog = { open: false, cardId: null, type: null };

      if (gs.actionsRemaining === 0) handleEndTurn(gs, playerId);
      return { ok: true, message: `Placed ${card.name}` };
    }

    case "dismiss-house-hotel": {
      gs.houseHotelDialog = { open: false, cardId: null, type: null };
      return { ok: true, message: "Dismissed" };
    }

    case "use-just-say-no": {
      gs.justSayNoDialog = { open: false, attackerName: "", actionDescription: "", pendingAction: null };
      gs.moveLog.unshift(logEntry(player.name, "played Just Say No!"));
      return { ok: true, message: "Just Say No played" };
    }

    case "allow-action": {
      gs.justSayNoDialog = { open: false, attackerName: "", actionDescription: "", pendingAction: null };
      return { ok: true, message: "Action allowed" };
    }

    case "end-turn": {
      if (gs.currentTurnPlayerId !== playerId) return { ok: false, message: "Not your turn" };
      const hand = gs.hands[playerId] || [];
      if (hand.length > 7) {
        gs.pendingBurn = true;
        gs.actionsRemaining = 0;
        return { ok: true, message: "Discard down to 7 cards" };
      }
      handleEndTurn(gs, playerId);
      return { ok: true, message: "Turn ended" };
    }

    case "discard-cards": {
      const cardIds = payload.cardIds as string[];
      const hand = gs.hands[playerId];
      const toDiscard = hand.filter((c: any) => cardIds.includes(c.id));
      gs.hands[playerId] = hand.filter((c: any) => !cardIds.includes(c.id));
      gs.discardPile.push(...toDiscard);
      gs.pendingBurn = false;
      gs.moveLog.unshift(logEntry(player.name, `discarded ${toDiscard.length} card(s)`));

      if (gs.actionsRemaining === 0) {
        rotateTurn(gs);
      }
      return { ok: true, message: "Cards discarded" };
    }

    case "reshuffle-deck": {
      if (gs.deck.length > 0) return { ok: false, message: "Deck still has cards" };
      const pile = [...gs.middlePile, ...gs.discardPile];
      if (pile.length === 0) return { ok: false, message: "No cards to reshuffle" };
      gs.deck = shuffle(pile);
      gs.middlePile = [];
      gs.discardPile = [];
      gs.moveLog.unshift(logEntry("System", `Reshuffled ${pile.length} cards into deck`));
      return { ok: true, message: "Deck reshuffled" };
    }

    default:
      return { ok: false, message: `Unknown action: ${action}` };
  }
}

function handlePlayProperty(gs: any, playerId: string, cardId: string): any {
  const hand = gs.hands[playerId];
  const cardIndex = hand.findIndex((c: any) => c.id === cardId);
  if (cardIndex < 0) return { ok: false, message: "Card not found" };
  const card = hand[cardIndex];
  const player = gs.players.find((p: any) => p.id === playerId);

  if (isPropertyWildcard(card)) {
    const isMulti = card.colors === "multi" || (Array.isArray(card.colors) && card.colors.length === 1 && card.colors[0] === "all");
    const colors: string[] = isMulti
      ? VALID_COLORS
      : (Array.isArray(card.colors) ? card.colors.filter((c: string) => VALID_COLORS.includes(c)) : []);

    if (colors.length === 0) return { ok: false, message: "No valid colors" };

    gs.wildcardDialog = { open: true, cardId, availableColors: colors };
    return { ok: true, message: "Choose color for wildcard" };
  }

  hand.splice(cardIndex, 1);
  player.propertySets = addCardToPropertySets(player.propertySets, card);
  gs.actionsRemaining -= 1;
  gs.playAreaCard = card;
  gs.moveLog.unshift(logEntry(player.name, `played ${card.name}`));

  const winner = checkWin(gs.players, playerId, gs.setsToWin);
  if (winner) {
    gs.winner = winner;
    gs.moveLog.unshift(logEntry(winner, "WON THE GAME!"));
  }

  if (gs.actionsRemaining === 0 && !gs.winner) {
    handleEndTurn(gs, playerId);
  }
  return { ok: true, message: `Played ${card.name}` };
}

function handlePlayRent(gs: any, playerId: string, cardId: string): any {
  const hand = gs.hands[playerId];
  const card = hand.find((c: any) => c.id === cardId);
  if (!card) return { ok: false, message: "Card not found" };

  const player = gs.players.find((p: any) => p.id === playerId);
  const isWild = isWildRentCard(card);
  const boardColors = player.propertySets
    .filter((s: any) => s.cards.length > 0)
    .map((s: any) => s.color);

  const colors = isWild
    ? boardColors.filter((c: string) => c !== "all")
    : (Array.isArray(card.colors) ? card.colors.filter((c: string) => boardColors.includes(c)) : []);

  gs.rentDialog = {
    open: true,
    cardId,
    availableColors: colors.length > 0 ? colors : (Array.isArray(card.colors) ? card.colors : []),
    resolvedColor: null,
    targetPlayerIds: [],
    isWildRent: isWild,
  };

  return { ok: true, message: "Choose rent color" };
}

function handlePlayAction(gs: any, playerId: string, cardId: string, targetPlayerId?: string): any {
  const hand = gs.hands[playerId];
  const cardIndex = hand.findIndex((c: any) => c.id === cardId);
  if (cardIndex < 0) return { ok: false, message: "Card not found" };
  const card = hand[cardIndex];
  const player = gs.players.find((p: any) => p.id === playerId);

  const cardName = card.name?.toUpperCase() || "";

  if (cardName.includes("PASS GO")) {
    const drawn = gs.deck.splice(0, 2);
    gs.hands[playerId] = [...gs.hands[playerId].filter((c: any) => c.id !== cardId), ...drawn];
    gs.actionsRemaining -= 1;
    gs.playAreaCard = card;
    gs.middlePile.push(card);
    gs.moveLog.unshift(logEntry(player.name, "played Pass Go, drew 2 cards"));
    if (gs.actionsRemaining === 0) handleEndTurn(gs, playerId);
    return { ok: true, message: "Pass Go played" };
  }

  if (cardName.includes("DEBT COLLECTOR") && targetPlayerId) {
    hand.splice(cardIndex, 1);
    const target = gs.players.find((p: any) => p.id === targetPlayerId);
    if (target) {
      const paid = Math.min(5, target.bankTotal);
      target.bankTotal -= paid;
      player.bankTotal += paid;
    }
    gs.actionsRemaining -= 1;
    gs.playAreaCard = card;
    gs.middlePile.push(card);
    gs.moveLog.unshift(logEntry(player.name, `played Debt Collector on ${target?.name}`));
    if (gs.actionsRemaining === 0) handleEndTurn(gs, playerId);
    return { ok: true, message: "Debt Collector played" };
  }

  if (cardName.includes("BIRTHDAY")) {
    hand.splice(cardIndex, 1);
    for (const p of gs.players) {
      if (p.id !== playerId) {
        const paid = Math.min(2, p.bankTotal);
        p.bankTotal -= paid;
        player.bankTotal += paid;
      }
    }
    gs.actionsRemaining -= 1;
    gs.playAreaCard = card;
    gs.middlePile.push(card);
    gs.moveLog.unshift(logEntry(player.name, "played It's My Birthday"));
    if (gs.actionsRemaining === 0) handleEndTurn(gs, playerId);
    return { ok: true, message: "Birthday played" };
  }

  if (cardName.includes("SLY DEAL")) {
    gs.stealDialog = { open: true, mode: "property", cardId, targetPlayerId: null };
    return { ok: true, message: "Choose property to steal" };
  }

  if (cardName.includes("DEAL BREAKER")) {
    gs.stealDialog = { open: true, mode: "set", cardId, targetPlayerId: null };
    return { ok: true, message: "Choose set to steal" };
  }

  if (cardName.includes("FORCED DEAL")) {
    gs.forcedDealDialog = { open: true, cardId };
    return { ok: true, message: "Choose cards to swap" };
  }

  if (cardName.includes("HOUSE")) {
    gs.houseHotelDialog = { open: true, cardId, type: "house" };
    return { ok: true, message: "Choose set for house" };
  }

  if (cardName.includes("HOTEL")) {
    gs.houseHotelDialog = { open: true, cardId, type: "hotel" };
    return { ok: true, message: "Choose set for hotel" };
  }

  if (cardName.includes("JUST SAY NO")) {
    hand.splice(cardIndex, 1);
    gs.middlePile.push(card);
    gs.actionsRemaining -= 1;
    gs.playAreaCard = card;
    gs.moveLog.unshift(logEntry(player.name, "played Just Say No"));
    if (gs.actionsRemaining === 0) handleEndTurn(gs, playerId);
    return { ok: true, message: "Just Say No played" };
  }

  if (cardName.includes("DOUBLE THE RENT")) {
    hand.splice(cardIndex, 1);
    gs.middlePile.push(card);
    gs.actionsRemaining -= 1;
    gs.playAreaCard = card;
    gs.moveLog.unshift(logEntry(player.name, "played Double the Rent"));
    if (gs.actionsRemaining === 0) handleEndTurn(gs, playerId);
    return { ok: true, message: "Double the Rent played" };
  }

  hand.splice(cardIndex, 1);
  gs.actionsRemaining -= 1;
  gs.playAreaCard = card;
  gs.middlePile.push(card);
  gs.moveLog.unshift(logEntry(player.name, `played ${card.name}${targetPlayerId ? ` on ${gs.players.find((p: any) => p.id === targetPlayerId)?.name}` : ""}`));
  if (gs.actionsRemaining === 0) handleEndTurn(gs, playerId);
  return { ok: true, message: `Played ${card.name}` };
}

function handleEndTurn(gs: any, playerId: string) {
  const hand = gs.hands[playerId] || [];
  if (hand.length > 7) {
    gs.pendingBurn = true;
    gs.actionsRemaining = 0;
    return;
  }
  gs.actionsRemaining = 0;
  rotateTurn(gs);
}

function rotateTurn(gs: any) {
  const playerIds = gs.players.map((p: any) => p.id);
  const currentIdx = playerIds.indexOf(gs.currentTurnPlayerId);
  const nextIdx = (currentIdx + 1) % playerIds.length;
  const nextPlayerId = playerIds[nextIdx];
  const nextPlayer = gs.players[nextIdx];

  gs.currentTurnPlayerId = nextPlayerId;
  gs.actionsRemaining = 3;
  if (nextPlayerId === gs.players[0].id) {
    gs.turnCount += 1;
  }

  const nextHand = gs.hands[nextPlayerId] || [];
  const drawCount = nextHand.length === 0 ? 5 : 2;
  const drawn = gs.deck.splice(0, drawCount);
  gs.hands[nextPlayerId] = [...nextHand, ...drawn];

  gs.moveLog.unshift(logEntry(nextPlayer.name, `started their turn and drew ${drawCount} cards`));
}
