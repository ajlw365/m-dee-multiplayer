"use client";

import { useState, useEffect, useCallback } from "react";
import { JoinRoom, type RoomConfig } from "@/components/join-room";
import { GameTable } from "@/components/game-table";
import { useGameStore } from "@/lib/use-game-store";
import { useSocket, type RoomPlayer } from "@/lib/socket";
import { Users, PlayCircle, Wifi, WifiOff, Crown, Loader2 } from "lucide-react";
import { WinScreen } from "@/components/win-screen";

type Screen = "join" | "lobby" | "game";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("join");
  const [roomConfig, setRoomConfig] = useState<RoomConfig | null>(null);
  const [lobbyPlayers, setLobbyPlayers] = useState<RoomPlayer[]>([]);
  const [playerId, setPlayerId] = useState<string>("");
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);

  const {
    connected,
    createRoom,
    joinRoom,
    startGame: socketStartGame,
    sendAction,
    leaveRoom,
    onPlayerJoined,
    onPlayerLeft,
    onGameStarted,
    onGameStateUpdate,
  } = useSocket();

  const applyServerState = useGameStore((s) => s.applyServerState);
  const winner = useGameStore((s) => s.winner);
  const players = useGameStore((s) => s.players);
  const currentPlayerId = useGameStore((s) => s.currentPlayerId);
  const hand = useGameStore((s) => s.hand);
  const turnCount = useGameStore((s) => s.turnCount);
  const currentTurnPlayerId = useGameStore((s) => s.currentTurnPlayerId);
  const actionsRemaining = useGameStore((s) => s.actionsRemaining);
  const playAreaCard = useGameStore((s) => s.playAreaCard);
  const moveLog = useGameStore((s) => s.moveLog);
  const rentDialog = useGameStore((s) => s.rentDialog);
  const deck = useGameStore((s) => s.deck);
  const discardPile = useGameStore((s) => s.discardPile);
  const middlePile = useGameStore((s) => s.middlePile);
  const pendingBurn = useGameStore((s) => s.pendingBurn);
  const playerHand = useGameStore((s) => s.hand);
  const wildcardDialog = useGameStore((s) => s.wildcardDialog);
  const stealDialog = useGameStore((s) => s.stealDialog);
  const forcedDealDialog = useGameStore((s) => s.forcedDealDialog);
  const houseHotelDialog = useGameStore((s) => s.houseHotelDialog);
  const justSayNoDialog = useGameStore((s) => s.justSayNoDialog);

  const opponents = players.filter((p) => p.id !== currentPlayerId);
  const currentPlayer = players.find((p) => p.id === currentPlayerId);

  useEffect(() => {
    if (!roomConfig) return;
    const unsub1 = onPlayerJoined((data) => {
      setLobbyPlayers(data.players);
    });
    const unsub2 = onPlayerLeft((data) => {
      setLobbyPlayers(data.players);
    });
    const unsub3 = onGameStarted((state) => {
      applyServerState(state);
      setScreen("game");
      setStarting(false);
    });
    const unsub4 = onGameStateUpdate((state) => {
      applyServerState(state);
    });
    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
    };
  }, [roomConfig, onPlayerJoined, onPlayerLeft, onGameStarted, onGameStateUpdate, applyServerState]);

  const handleJoin = async (config: RoomConfig) => {
    setError("");
    let result;
    if (config.isHost) {
      result = await createRoom({
        roomId: config.roomId,
        playerName: config.playerName,
        maxPlayers: config.maxPlayers,
        setsToWin: config.setsToWin,
      });
    } else {
      result = await joinRoom({
        roomId: config.roomId,
        playerName: config.playerName,
      });
    }
    if (!result.ok) {
      setError(result.error || "Failed to join room");
      return;
    }
    setPlayerId(result.playerId!);
    setLobbyPlayers(result.players!);
    setRoomConfig(config);
    setScreen("lobby");
  };

  const handleStartGame = async () => {
    if (!roomConfig) return;
    setStarting(true);
    const result = await socketStartGame(roomConfig.roomId);
    if (!result.ok) {
      setError(result.error || "Failed to start game");
      setStarting(false);
    }
  };

  const handleLeave = () => {
    if (roomConfig) leaveRoom(roomConfig.roomId);
    setRoomConfig(null);
    setLobbyPlayers([]);
    setPlayerId("");
    setScreen("join");
  };

  const handlePlayAgain = async () => {
    if (!roomConfig) return;
    setStarting(true);
    const result = await socketStartGame(roomConfig.roomId);
    if (!result.ok) {
      setError(result.error || "Failed to restart game");
      setStarting(false);
    }
  };

  const handleAction = useCallback(
    async (action: string, payload: any = {}) => {
      if (!roomConfig) return { ok: false, message: "No room" };
      const result = await sendAction(roomConfig.roomId, action, payload);
      return result;
    },
    [roomConfig, sendAction]
  );

  const handlePlayCard = useCallback(
    (cardId: string, targetPlayerId?: string) => {
      return handleAction("play-card", { cardId, targetPlayerId });
    },
    [handleAction]
  );

  const handleBankCard = useCallback(
    (cardId: string) => handleAction("bank-card", { cardId }),
    [handleAction]
  );

  const handleEndTurn = useCallback(() => handleAction("end-turn", {}), [handleAction]);

  const handleRotateTurn = useCallback(() => {}, []);

  const handleBurnCards = useCallback(
    (cardIds: string[]) => handleAction("discard-cards", { cardIds }),
    [handleAction]
  );

  const handleResolveRentColor = useCallback(
    (color: string) => handleAction("resolve-rent-color", { color }),
    [handleAction]
  );

  const handleConfirmRent = useCallback(
    (targetPlayerIds: string[], useDoubleRent?: boolean) =>
      handleAction("confirm-rent", { targetPlayerIds, useDoubleRent }),
    [handleAction]
  );

  const handleDismissRentDialog = useCallback(
    () => handleAction("dismiss-rent", {}),
    [handleAction]
  );

  const handleConfirmWildcard = useCallback(
    (cardId: string, color: string) => handleAction("confirm-wildcard", { cardId, color }),
    [handleAction]
  );

  const handleDismissWildcard = useCallback(
    () => handleAction("dismiss-wildcard", {}),
    [handleAction]
  );

  const handleConfirmStealProperty = useCallback(
    (targetPlayerId: string, propertyId: string) =>
      handleAction("confirm-steal-property", { targetPlayerId, propertyId }),
    [handleAction]
  );

  const handleConfirmStealSet = useCallback(
    (targetPlayerId: string, color: string) =>
      handleAction("confirm-steal-set", { targetPlayerId, color }),
    [handleAction]
  );

  const handleDismissSteal = useCallback(
    () => handleAction("dismiss-steal", {}),
    [handleAction]
  );

  const handleConfirmForcedDeal = useCallback(
    (myPropId: string, myColor: string, targetId: string, targetPropId: string) =>
      handleAction("confirm-forced-deal", {
        myPropertyId: myPropId,
        mySetColor: myColor,
        targetPlayerId: targetId,
        targetPropertyId: targetPropId,
      }),
    [handleAction]
  );

  const handleDismissForcedDeal = useCallback(
    () => handleAction("dismiss-forced-deal", {}),
    [handleAction]
  );

  const handleConfirmHouseHotel = useCallback(
    (color: string) => handleAction("confirm-house-hotel", { color }),
    [handleAction]
  );

  const handleDismissHouseHotel = useCallback(
    () => handleAction("dismiss-house-hotel", {}),
    [handleAction]
  );

  const handleUseJustSayNo = useCallback(
    () => handleAction("use-just-say-no", {}),
    [handleAction]
  );

  const handleAllowAction = useCallback(
    () => handleAction("allow-action", {}),
    [handleAction]
  );

  const handleReshuffleDeck = useCallback(
    () => handleAction("reshuffle-deck", {}),
    [handleAction]
  );

  const rentAmount = (() => {
    if (!rentDialog.resolvedColor || !currentPlayer) return 0;
    const set = currentPlayer.propertySets.find(
      (s) => s.color === rentDialog.resolvedColor,
    );
    if (!set) return 0;
    const count = set.cards.length;
    const propCard = set.cards.find((c) => "rentTable" in c && (c as any).rentTable.length > 0) as any;
    const DEFAULT_RENT: Record<string, {cards:number;rent:number}[]> = {
      darkblue: [{cards:1,rent:3},{cards:2,rent:8}],
      brown: [{cards:1,rent:1},{cards:2,rent:2}],
      lightblue: [{cards:1,rent:1},{cards:2,rent:2},{cards:3,rent:3}],
      pink: [{cards:1,rent:1},{cards:2,rent:2},{cards:3,rent:4}],
      orange: [{cards:1,rent:1},{cards:2,rent:3},{cards:3,rent:5}],
      red: [{cards:1,rent:2},{cards:2,rent:3},{cards:3,rent:6}],
      yellow: [{cards:1,rent:2},{cards:2,rent:4},{cards:3,rent:6}],
      green: [{cards:1,rent:2},{cards:2,rent:4},{cards:3,rent:7}],
      railroad: [{cards:1,rent:1},{cards:2,rent:2},{cards:3,rent:3},{cards:4,rent:4}],
      utility: [{cards:1,rent:1},{cards:2,rent:2}],
      purple: [{cards:1,rent:1},{cards:2,rent:2},{cards:3,rent:4}],
    };
    const rentTable = propCard?.rentTable ?? DEFAULT_RENT[rentDialog.resolvedColor] ?? [];
    if (rentTable.length === 0) return 0;
    const sorted = [...rentTable].sort(
      (a: any, b: any) => b.cards - a.cards,
    );
    return (sorted.find((r: any) => count >= r.cards) as any)?.rent ?? 0;
  })();

  const gameState = {
    players,
    currentPlayerId,
    hand,
    turnCount,
    currentTurnPlayerId,
    actionsRemaining,
    playAreaCard,
    moveLog,
    deck,
    discardPile,
    middlePile,
  };

  if (screen === "join") {
    return <JoinRoom onJoin={handleJoin} socketError={error} connected={connected} />;
  }

  if (screen === "lobby" && roomConfig) {
    const isHost = lobbyPlayers.find((p) => p.socketId && p.isHost)?.name === roomConfig.playerName;
    return (
      <div className="flex h-dvh flex-col items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-black text-foreground uppercase tracking-wide mb-1">
              M-Dee WA
            </h1>
            <p className="text-[11px] text-muted-foreground uppercase tracking-widest">
              Room #{roomConfig.roomId}
            </p>
            <div className="mt-2 flex items-center justify-center gap-1.5">
              {connected ? (
                <>
                  <Wifi className="h-3 w-3 text-green-500" />
                  <span className="text-[10px] text-green-500 font-medium">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 text-red-500" />
                  <span className="text-[10px] text-red-500 font-medium">Disconnected</span>
                </>
              )}
            </div>
          </div>

          <div className="rounded-3xl border-2 border-border bg-card p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Players ({lobbyPlayers.length}/{roomConfig.maxPlayers})
              </p>
            </div>
            <div className="space-y-2">
              {lobbyPlayers.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl bg-secondary px-3 py-2"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground">
                    {p.avatar}
                  </div>
                  <span className="text-xs font-bold text-foreground">
                    {p.name}
                  </span>
                  {p.isHost && (
                    <Crown className="ml-auto h-3.5 w-3.5 text-yellow-500" />
                  )}
                  {p.name === roomConfig.playerName && (
                    <span className={`${p.isHost ? "" : "ml-auto"} text-[9px] font-bold text-primary uppercase tracking-wider`}>
                      You
                    </span>
                  )}
                </div>
              ))}

              {Array.from({ length: roomConfig.maxPlayers - lobbyPlayers.length }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex items-center gap-3 rounded-xl border-2 border-dashed border-border px-3 py-2"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] text-muted-foreground">
                    ?
                  </div>
                  <span className="text-xs text-muted-foreground italic">
                    Waiting for player...
                  </span>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="mb-3 text-sm text-destructive font-medium text-center" role="alert">
              {error}
            </p>
          )}

          {isHost ? (
            <button
              type="button"
              onClick={handleStartGame}
              disabled={lobbyPlayers.length < 2 || starting}
              className="btn-3d btn-3d-primary flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-black text-primary-foreground uppercase tracking-wide disabled:opacity-50"
            >
              {starting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <PlayCircle className="h-5 w-5" />
              )}
              {starting ? "Starting..." : lobbyPlayers.length < 2 ? "Waiting for players..." : "Start Game"}
            </button>
          ) : (
            <div className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-border bg-card py-4 text-sm font-bold text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Waiting for host to start...
            </div>
          )}

          <button
            type="button"
            onClick={handleLeave}
            className="mt-3 w-full text-center text-[10px] text-muted-foreground hover:text-foreground"
          >
            Leave room
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <GameTable
        gameState={gameState}
        roomId={roomConfig!.roomId}
        playerName={roomConfig!.playerName}
        onLeave={handleLeave}
        onPlayCard={handlePlayCard}
        onBankCard={handleBankCard}
        onEndTurn={handleEndTurn}
        onRotateTurn={handleRotateTurn}
        onBurnCards={handleBurnCards}
        rentDialog={rentDialog}
        rentAmount={rentAmount}
        opponents={opponents}
        onResolveRentColor={handleResolveRentColor}
        onConfirmRent={handleConfirmRent}
        onDismissRentDialog={handleDismissRentDialog}
        wildcardDialog={wildcardDialog}
        onConfirmWildcard={handleConfirmWildcard}
        onDismissWildcard={handleDismissWildcard}
        stealDialog={stealDialog}
        onConfirmStealProperty={handleConfirmStealProperty}
        onConfirmStealSet={handleConfirmStealSet}
        onDismissStealDialog={handleDismissSteal}
        forcedDealDialog={forcedDealDialog}
        onConfirmForcedDeal={handleConfirmForcedDeal}
        onDismissForcedDeal={handleDismissForcedDeal}
        houseHotelDialog={houseHotelDialog}
        onConfirmHouseHotel={handleConfirmHouseHotel}
        onDismissHouseHotel={handleDismissHouseHotel}
        justSayNoDialog={justSayNoDialog}
        onUseJustSayNo={handleUseJustSayNo}
        onAllowAction={handleAllowAction}
        pendingBurn={pendingBurn}
        onReshuffleDeck={handleReshuffleDeck}
        playerHand={playerHand}
      />
      {winner && (
        <WinScreen
          winnerName={winner}
          isHumanWinner={winner === roomConfig!.playerName}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </>
  );
}
