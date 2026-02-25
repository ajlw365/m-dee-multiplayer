"use client";

import { useState } from "react";
import {
  Hash,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Users,
  Plus,
  LogIn,
  User,
  Trophy,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface RoomConfig {
  roomId: string;
  playerName: string;
  maxPlayers: number;
  setsToWin: number;
  isHost: boolean;
}

interface JoinRoomProps {
  onJoin: (config: RoomConfig) => void;
  socketError?: string;
  connected?: boolean;
}

type Screen = "landing" | "join-credentials" | "join-name" | "create-room";

export function JoinRoom({ onJoin, socketError, connected }: JoinRoomProps) {
  const [screen, setScreen] = useState<Screen>("landing");
  const [roomId, setRoomId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [setsToWin, setSetsToWin] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJoinSubmitCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!roomId.trim()) {
      setError("Please enter game ID");
      return;
    }
    setScreen("join-name");
  };

  const handleJoinSubmitName = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }
    setIsLoading(true);
    onJoin({
      roomId: roomId.trim(),
      playerName: playerName.trim(),
      maxPlayers: 4,
      setsToWin: 3,
      isHost: false,
    });
    setIsLoading(false);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!roomId.trim()) {
      setError("Enter game ID");
      return;
    }
    if (!playerName.trim()) {
      setError("Enter your name");
      return;
    }
    setIsLoading(true);
    onJoin({
      roomId: roomId.trim(),
      playerName: playerName.trim(),
      maxPlayers,
      setsToWin,
      isHost: true,
    });
    setIsLoading(false);
  };

  const resetToLanding = () => {
    setScreen("landing");
    setRoomId("");
    setPlayerName("");
    setError("");
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-5 py-8">
      {/* Decorative accent */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-1 w-48 rounded-full bg-primary" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-subtle ring-1 ring-primary">
            <span className="text-2xl font-black tracking-tighter text-primary">
              MD
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            M-Dee
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
            {screen === "landing" && "We love a bit of M-Dee"}
            {screen === "join-credentials" && "Enter room details to join"}
            {screen === "join-name" &&
              "Almost there \u2014 what should we call you?"}
            {screen === "create-room" && "Set up your private room"}
          </p>
        </div>

        {socketError && (
          <p className="mb-4 text-sm text-destructive font-medium text-center" role="alert">
            {socketError}
          </p>
        )}

        {/* Landing Screen */}
        {screen === "landing" && (
          <div className="flex flex-col gap-4">
            <button
              type="button"
              onClick={() => setScreen("join-credentials")}
              disabled={!connected}
              className="btn-3d btn-3d-primary flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-base disabled:opacity-50"
            >
              <LogIn className="h-5 w-5" aria-hidden="true" />
              Join Room
            </button>
            <button
              type="button"
              onClick={() => setScreen("create-room")}
              disabled={!connected}
              className="btn-3d btn-3d-secondary flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-border bg-card text-foreground font-semibold text-base disabled:opacity-50"
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
              Create Room
            </button>
            {!connected && (
              <p className="text-xs text-muted-foreground text-center">Connecting to server...</p>
            )}
          </div>
        )}

        {/* Join - Credentials Screen */}
        {screen === "join-credentials" && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <form
              onSubmit={handleJoinSubmitCredentials}
              className="flex flex-col gap-5"
            >
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="joinRoomId"
                  className="text-sm font-medium text-foreground"
                >
                  Room ID
                </Label>
                <div className="relative">
                  <Hash
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    id="joinRoomId"
                    type="text"
                    placeholder="e.g. GAME-7742"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="h-12 pl-10 rounded-xl bg-input border-border text-foreground placeholder:text-text-dim focus-visible:ring-2 focus-visible:ring-primary"
                    autoComplete="off"
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <p
                  className="text-sm text-destructive font-medium"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={resetToLanding}
                  className="btn-3d btn-3d-ghost flex h-12 items-center gap-1 rounded-xl px-4 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Back
                </button>
                <button
                  type="submit"
                  className="btn-3d btn-3d-primary flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold text-base"
                >
                  Next
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Join - Enter Name Screen */}
        {screen === "join-name" && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <form
              onSubmit={handleJoinSubmitName}
              className="flex flex-col gap-5"
            >
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="playerName"
                  className="text-sm font-medium text-foreground"
                >
                  Your Name
                </Label>
                <div className="relative">
                  <User
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    id="playerName"
                    type="text"
                    placeholder="Enter your display name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="h-12 pl-10 rounded-xl bg-input border-border text-foreground placeholder:text-text-dim focus-visible:ring-2 focus-visible:ring-primary"
                    autoComplete="off"
                    autoFocus
                    maxLength={16}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  This is how other players will see you
                </p>
              </div>

              {error && (
                <p
                  className="text-sm text-destructive font-medium"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setScreen("join-credentials");
                    setError("");
                  }}
                  className="btn-3d btn-3d-ghost flex h-12 items-center gap-1 rounded-xl px-4 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-3d btn-3d-primary flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold text-base disabled:opacity-60"
                >
                  {isLoading ? (
                    <Loader2
                      className="h-5 w-5 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <>
                      Join Game
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                  <span className="sr-only">
                    {isLoading ? "Joining..." : "Join game"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Create Room Screen */}
        {screen === "create-room" && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-5">
              {/* Room ID */}
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="createRoomId"
                  className="text-sm font-medium text-foreground"
                >
                  Room ID
                </Label>
                <div className="relative">
                  <Hash
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    id="createRoomId"
                    type="text"
                    placeholder="Choose a room ID"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="h-12 pl-10 rounded-xl bg-input border-border text-foreground placeholder:text-text-dim focus-visible:ring-2 focus-visible:ring-primary"
                    autoComplete="off"
                    autoFocus
                  />
                </div>
              </div>

              {/* Your Name */}
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="createPlayerName"
                  className="text-sm font-medium text-foreground"
                >
                  Your Name
                </Label>
                <div className="relative">
                  <User
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    id="createPlayerName"
                    type="text"
                    placeholder="Enter your display name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="h-12 pl-10 rounded-xl bg-input border-border text-foreground placeholder:text-text-dim focus-visible:ring-2 focus-visible:ring-primary"
                    autoComplete="off"
                    maxLength={16}
                  />
                </div>
              </div>

              {/* Number of Players */}
              <div className="flex flex-col gap-2.5">
                <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Users
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  Number of Players
                </Label>
                <div className="flex gap-2">
                  {[2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setMaxPlayers(n)}
                      className={`btn-3d flex-1 h-11 rounded-xl font-bold text-sm ${
                        maxPlayers === n
                          ? "btn-3d-primary bg-primary text-primary-foreground ring-2 ring-primary"
                          : "btn-3d-ghost bg-input text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sets to Win */}
              <div className="flex flex-col gap-2.5">
                <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Trophy
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  Full Sets to Win
                </Label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSetsToWin(3)}
                    className={`btn-3d flex-1 flex flex-col items-center gap-1 rounded-2xl py-3 px-2 border-2 ${
                      setsToWin === 3
                        ? "btn-3d-primary border-primary bg-primary-subtle text-primary ring-2 ring-primary"
                        : "btn-3d-ghost border-border bg-input text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <span className="text-2xl font-black">3</span>
                    <span className="text-[10px] font-medium uppercase tracking-wider">
                      Sets
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSetsToWin(4)}
                    className={`btn-3d flex-1 flex flex-col items-center gap-1 rounded-2xl py-3 px-2 border-2 ${
                      setsToWin === 4
                        ? "btn-3d-primary border-primary bg-primary-subtle text-primary ring-2 ring-primary"
                        : "btn-3d-ghost border-border bg-input text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <span className="text-2xl font-black">4</span>
                    <span className="text-[10px] font-medium uppercase tracking-wider">
                      Sets
                    </span>
                  </button>
                </div>
              </div>

              {error && (
                <p
                  className="text-sm text-destructive font-medium"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={resetToLanding}
                  className="btn-3d btn-3d-ghost flex h-12 items-center gap-1 rounded-xl px-4 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-3d btn-3d-primary flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold text-base disabled:opacity-60"
                >
                  {isLoading ? (
                    <Loader2
                      className="h-5 w-5 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <>
                      Create Room
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                  <span className="sr-only">
                    {isLoading ? "Creating room..." : "Create room"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {screen === "landing" && "Join an existing room or create your own"}
          {screen === "join-credentials" && "Ask the host for the room ID"}
          {screen === "join-name" && "Max 16 characters"}
          {screen === "create-room" && "Share the room ID with friends"}
        </p>

        <div className="mt-8 text-center border-t border-border-dim pt-4">
          <p className="text-[10px] text-muted-foreground">v1.0.0</p>
          <p className="text-[9px] text-text-dim mt-1">
            Built by Ashton Wardle
          </p>
        </div>
      </div>
    </div>
  );
}
