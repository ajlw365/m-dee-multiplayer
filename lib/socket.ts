"use client";

import { io, Socket } from "socket.io-client";
import { useEffect, useRef, useState, useCallback } from "react";

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io({
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
  }
  return socket;
}

export interface RoomPlayer {
  id: string;
  socketId: string;
  name: string;
  avatar: string;
  isHost: boolean;
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const s = getSocket();
    socketRef.current = s;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);

    if (s.connected) setConnected(true);
    if (!s.connected) s.connect();

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
    };
  }, []);

  const createRoom = useCallback(
    (data: { roomId: string; playerName: string; maxPlayers: number; setsToWin: number }): Promise<{ ok: boolean; playerId?: string; players?: RoomPlayer[]; error?: string }> => {
      return new Promise((resolve) => {
        socketRef.current?.emit("create-room", data, (res: any) => resolve(res));
      });
    },
    []
  );

  const joinRoom = useCallback(
    (data: { roomId: string; playerName: string }): Promise<{ ok: boolean; playerId?: string; players?: RoomPlayer[]; error?: string }> => {
      return new Promise((resolve) => {
        socketRef.current?.emit("join-room", data, (res: any) => resolve(res));
      });
    },
    []
  );

  const startGame = useCallback(
    (roomId: string): Promise<{ ok: boolean; error?: string }> => {
      return new Promise((resolve) => {
        socketRef.current?.emit("start-game", { roomId }, (res: any) => resolve(res));
      });
    },
    []
  );

  const sendAction = useCallback(
    (roomId: string, action: string, payload: any): Promise<any> => {
      return new Promise((resolve) => {
        socketRef.current?.emit("game-action", { roomId, action, payload }, (res: any) => resolve(res));
      });
    },
    []
  );

  const leaveRoom = useCallback(
    (roomId: string) => {
      socketRef.current?.emit("leave-room", { roomId });
    },
    []
  );

  const onPlayerJoined = useCallback(
    (cb: (data: { players: RoomPlayer[] }) => void) => {
      socketRef.current?.on("player-joined", cb);
      return () => { socketRef.current?.off("player-joined", cb); };
    },
    []
  );

  const onPlayerLeft = useCallback(
    (cb: (data: { playerName: string; players: RoomPlayer[] }) => void) => {
      socketRef.current?.on("player-left", cb);
      return () => { socketRef.current?.off("player-left", cb); };
    },
    []
  );

  const onGameStarted = useCallback(
    (cb: (state: any) => void) => {
      socketRef.current?.on("game-started", cb);
      return () => { socketRef.current?.off("game-started", cb); };
    },
    []
  );

  const onGameStateUpdate = useCallback(
    (cb: (state: any) => void) => {
      socketRef.current?.on("game-state-update", cb);
      return () => { socketRef.current?.off("game-state-update", cb); };
    },
    []
  );

  return {
    socket: socketRef.current,
    connected,
    createRoom,
    joinRoom,
    startGame,
    sendAction,
    leaveRoom,
    onPlayerJoined,
    onPlayerLeft,
    onGameStarted,
    onGameStateUpdate,
  };
}
