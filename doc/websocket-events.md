# WebSocket Event Structure

> Reference document for all Socket.io events used in ft_transcendence.
> Each event lists its direction, payload, and purpose.

---

## Chat Events

| Event | Direction | Payload | Purpose |
|-------|-----------|---------|---------|
| `send_message` | Client → Server | `{ to: string, text: string }` | Send a chat message to a user |
| `receive_message` | Server → Client | `{ from: string, text: string, timestamp: string }` | Deliver a chat message to recipient |
| `typing` | Client → Server | `{ to: string }` | Notify server that user is typing |
| `user_typing` | Server → Client | `{ from: string }` | Show typing indicator to recipient |

## Game Events

| Event | Direction | Payload | Purpose |
|-------|-----------|---------|---------|
| `find_game` | Client → Server | `{}` | Join the matchmaking queue |
| `cancel_search` | Client → Server | `{}` | Leave the matchmaking queue |
| `game_found` | Server → Client | `{ gameId: string, opponent: { id, username }, yourSymbol: "X" \| "O" }` | Match found, game is starting |
| `make_move` | Client → Server | `{ gameId: string, cell: number }` | Place a symbol (cell 0-8 for 3x3) |
| `game_update` | Server → Client | `{ gameId: string, board: string[], currentTurn: "X" \| "O" }` | Updated board state after a move |
| `game_over` | Server → Client | `{ gameId: string, winner: string \| null, winningCells: number[] \| null }` | Game finished (winner or draw) |
| `opponent_disconnected` | Server → Client | `{ gameId: string }` | Opponent lost connection, waiting 30s |
| `opponent_reconnected` | Server → Client | `{ gameId: string }` | Opponent reconnected |
| `game_forfeit` | Server → Client | `{ gameId: string, winner: string }` | Opponent didn't reconnect in time |

## Status Events

| Event | Direction | Payload | Purpose |
|-------|-----------|---------|---------|
| `connect` | Built-in | — | User connected, set `isOnline = true` |
| `disconnect` | Built-in | — | User disconnected, set `isOnline = false` |
| `user_online` | Server → Client | `{ userId: string }` | Notify friends that user came online |
| `user_offline` | Server → Client | `{ userId: string }` | Notify friends that user went offline |

## Tournament Events

| Event | Direction | Payload | Purpose |
|-------|-----------|---------|---------|
| `tournament_match_ready` | Server → Client | `{ tournamentId: string, gameId: string, opponent: { id, username } }` | Notify player their tournament match is starting |
| `tournament_update` | Server → Client | `{ tournamentId: string, bracket: object }` | Bracket updated after a match completes |

---

## Authentication

All Socket.io connections must include a JWT token in the handshake:

```ts
// Client
const socket = io({
  path: "/socket.io",
  auth: { token: "Bearer <jwt>" },
});
```

```ts
// Server middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  // verify JWT, attach user to socket
});
```

## Rooms Strategy

- **Game rooms**: Each active game gets a room named `game:<gameId>`. Both players join on `game_found`, leave on `game_over`.
- **User rooms**: Each authenticated user joins a room named `user:<userId>` for receiving direct messages and notifications.
- **Tournament rooms**: `tournament:<tournamentId>` for bracket updates.
