# M-Dee - Property Card Game

## Overview
M-Dee is a multiplayer property card game web application where users can create or join private rooms to play with real people in real-time. Built with Next.js 16, React 19, Tailwind CSS 4, and Socket.IO.

## Recent Changes
- 2026-02-25: Major refactor — removed AI players, added Socket.IO real-time multiplayer. Created custom Express server (server.ts) wrapping Next.js with Socket.IO for room management and authoritative game state. Game state now lives on server; client Zustand store is a thin state receiver. Deployment changed to VM (persistent WebSocket connections). Removed unused game-engine.ts.
- 2026-02-24: Fixed rent dialog $0 bug (auto-resolve single color), added House/Hotel placement dialog (choose complete set), Just Say No dialog (block incoming actions), renamed play area to "Table" (only action/burned cards shown), moved deck/turn info right of table card, redesigned two-color wildcards (split top/bottom colors, front of solitaire stack).
- 2026-02-24: Fixed money cards (bank-only, no PLAY), wild rent detection (isWildRentCard helper for colors:["all"]), AI double-draw bug, burn/discard flow (pendingBurn flag), rainbow gradient for wild properties, rent targeting (dual-color=all players, wild rent=choose one).
- 2026-02-23: Migrated from Vercel to Replit. Removed @vercel/analytics, configured port 5000 for Replit compatibility, added allowedDevOrigins for iframe support.

## Project Architecture
- **Framework**: Next.js 16.1.6 (App Router) with custom Express server
- **Realtime**: Socket.IO (server + client) for multiplayer room management and game state sync
- **UI**: React 19, Radix UI components, Tailwind CSS 4, shadcn/ui
- **State**: Zustand (client-side thin store, receives state from server)
- **Package Manager**: pnpm
- **Structure**:
  - `server.ts` - Custom Express + Socket.IO + Next.js server (authoritative game logic)
  - `app/` - Next.js app router pages and layouts
  - `components/` - React components (game-table, join-room, UI primitives)
  - `lib/` - Utilities, types, socket client hook, game store
  - `lib/socket.ts` - Socket.IO client hook (useSocket)
  - `lib/use-game-store.ts` - Zustand store (thin client, applyServerState)
  - `hooks/` - Custom React hooks
  - `public/` - Static assets (icons, images)
  - `styles/` - Global stylesheets

## Multiplayer Architecture
- **Server (server.ts)**: Manages rooms, game state, card dealing, turn rotation, all game actions
- **Client (lib/socket.ts)**: useSocket hook provides createRoom, joinRoom, startGame, sendAction, leaveRoom
- **Flow**: Create/Join Room → Lobby (wait for players) → Host starts → Game plays via socket actions
- **State sync**: Server processes actions, broadcasts personalized game views to each player (each sees only their own hand)

## Running the Project
- Dev: `pnpm run dev` (tsx server.ts, port 5000)
- Build: `pnpm run build`
- Start: `pnpm run start` (NODE_ENV=production tsx server.ts, port 5000)

## Deployment
- Target: VM (required for persistent WebSocket connections)
- Build: `npm run build`
- Run: `npm run start`
