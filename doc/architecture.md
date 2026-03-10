# Project Architecture — ft_transcendence

## System Overview

```mermaid
flowchart TD
    subgraph Client["🌐 Browser"]
        UI["React SPA\n(port 5173)"]
    end

    subgraph Server["⚙️ Node.js / Express (port 3000 · HTTPS)"]
        REST["REST API\n/api/*\n\nauth · users · friends\nchat · stats · tournaments"]
        WS["Socket.IO Server\nWebSocket\n\ngame moves · matchmaking\npresence · live chat"]
        AUTH["JWT Middleware\nverifies token\non every request"]
        PRISMA["Prisma ORM\ntype-safe queries"]
    end

    subgraph DB["🗄️ PostgreSQL 16 (Docker)"]
        TABLES["Users · Games · Friends\nMessages · Tournaments\nTournamentParticipants\nTournamentMatches"]
    end

    UI -->|"HTTPS REST\nJSON"| REST
    UI <-->|"WebSocket\npersistent"| WS
    REST --> AUTH
    WS --> AUTH
    AUTH --> PRISMA
    PRISMA -->|"SQL"| TABLES
```

---

## Two Communication Channels

| | REST API | WebSocket |
|---|---|---|
| **Protocol** | HTTPS request/response | Persistent Socket.IO connection |
| **Used for** | Login, signup, profile, friends, stats, history | Live game moves, matchmaking queue, online presence, real-time chat |
| **Auth** | JWT in `Authorization` header | JWT sent on socket handshake |
| **When** | One-off actions | Continuous updates |

---

## How a Login Works (REST)

```mermaid
sequenceDiagram
    participant B as Browser
    participant E as Express
    participant P as Prisma
    participant DB as PostgreSQL

    B->>E: POST /api/auth/login {email, password}
    E->>P: user.findUnique({ where: { email } })
    P->>DB: SELECT * FROM "User" WHERE email = ?
    DB-->>P: user row
    P-->>E: user object
    E->>E: bcrypt.compare(password, user.passwordHash)
    E-->>B: { token: "JWT..." }
    B->>B: store token in memory
```

---

## How a Game Move Works (WebSocket)

```mermaid
sequenceDiagram
    participant P1 as Player 1
    participant SIO as Socket.IO Server
    participant P as Prisma
    participant P2 as Player 2

    P1->>SIO: emit("make_move", { gameId, index })
    SIO->>SIO: validate turn + board state
    SIO->>P: game.update({ board, currentTurn })
    SIO-->>P1: emit("move_made", { board, nextTurn })
    SIO-->>P2: emit("move_made", { board, nextTurn })
    Note over SIO: if win detected →
    SIO-->>P1: emit("game_over", { winner })
    SIO-->>P2: emit("game_over", { winner })
```

---

## Folder Structure

```
ft_transcendence/
├── frontend/          ← React SPA (TypeScript + Tailwind)
│   └── src/
│       ├── pages/     ← one file per route (Game, Matchmaking, Profile…)
│       ├── components/← reusable UI pieces
│       ├── services/  ← API call functions
│       ├── context/   ← SocketContext, AuthContext
│       └── types/     ← shared TypeScript types
│
├── backend/           ← Express API (TypeScript)
│   └── src/
│       ├── routes/    ← one file per resource (auth, users, games…)
│       ├── services/  ← business logic (auth.service, game.service…)
│       ├── middleware/← JWT auth, error handling
│       └── socket/    ← Socket.IO event handlers
│   └── prisma/
│       ├── schema.prisma   ← DB table definitions
│       └── migrations/     ← SQL migration history
│
└── docker-compose.yml ← starts frontend + backend + postgres together
```

---

## How to Explain It (30 seconds)

> *"We have a classic 3-tier architecture. The browser runs a React SPA — it never touches the database directly. All data goes through the Express backend on port 3000 over HTTPS. We have two channels: a REST API for standard actions like login and profile updates, and a persistent WebSocket connection via Socket.IO for anything real-time — game moves, matchmaking, and live chat. The backend uses Prisma ORM to talk to PostgreSQL, which means all queries are type-safe and schema-driven. Everything starts with one command: `docker compose up`."*
