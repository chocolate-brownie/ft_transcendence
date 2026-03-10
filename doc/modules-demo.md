# Modules Demo Guide — ft_transcendence

> **Rule:** 14 points minimum to pass. We claim 18 (4pt safety buffer).
> Demo each module fully — show it working, don't just describe it.

---

## Point Summary

```mermaid
flowchart LR
    subgraph Major["🔴 Major Modules — 2pts each"]
        direction TB
        MA1["#1 Web Frameworks\nReact + Express"]
        MA2["#3 WebSockets\nSocket.IO"]
        MA3["#4 User Interaction\nChat + Friends + Profiles"]
        MA4["#5 User Management\nAuth + Avatars + Status"]
        MA5["#6 Tic-Tac-Toe\nGame"]
        MA6["#7 Remote Players\nOnline 1v1"]
        MA7["#9 AI Opponent\nMinimax"]
    end

    subgraph Minor["🟡 Minor Modules — 1pt each"]
        direction TB
        MI1["#2 Prisma ORM"]
        MI2["#8 Tournament\nBracket system"]
        MI3["#10 Game Customization\nThemes + Symbols"]
        MI4["#11 Statistics\nLeaderboard + History"]
    end

    subgraph Total["📊 Total"]
        T1["7 Major = 14pts"]
        T2["4 Minor = 4pts"]
        T3["Total = 18pts ✅\nBuffer = 4pts"]
    end
```

---

## Module Map

```mermaid
flowchart TD
    subgraph Core["🔵 Core — 14pts (MUST pass)"]
        M1["#1 Web Frameworks\nReact + Express · Major · 2pts"]
        M2["#2 Prisma ORM\nMinor · 1pt"]
        M3["#3 WebSockets\nSocket.IO · Major · 2pts"]
        M4["#4 User Interaction\nChat + Friends + Profiles · Major · 2pts"]
        M5["#5 User Management\nAuth + Avatars + Status · Major · 2pts"]
        M6["#6 Tic-Tac-Toe Game\nMajor · 2pts"]
        M7["#7 Remote Players\nOnline 1v1 · Major · 2pts"]
        M8["#8 Tournament\nBracket system · Minor · 1pt"]
    end

    subgraph Bonus["🟡 Bonus — 4pts (safety buffer)"]
        M9["#9 AI Opponent\nMinimax · Major · 2pts"]
        M10["#10 Game Customization\nThemes + Symbols · Minor · 1pt"]
        M11["#11 Statistics\nLeaderboard + History · Minor · 1pt"]
    end

    M6 -->|"required by"| M7
    M6 -->|"required by"| M8
    M6 -->|"required by"| M9
    M6 -->|"required by"| M10
    M6 -->|"required by"| M11
```

---

## #1 — Web Frameworks `Major · 2pts`

```mermaid
flowchart LR
    B["Browser\nReact SPA"] -->|"HTTP /api/*"| E["Express\nREST API"]
    B <-->|"WebSocket"| S["Socket.IO"]
    E --- S
```

**Demo:** App is running → DevTools → Network → any `/api/` call → confirm Express responds.

**Say:** _"React handles the UI, Express handles the API. Both are real frameworks — not plain HTML/CSS or raw Node."_

---

## #2 — Prisma ORM `Minor · 1pt`

```mermaid
flowchart LR
    C["TypeScript\nCode"] -->|"prisma.user.findUnique()"| P["Prisma Client\nauto-generated"]
    P -->|"parameterized SQL"| DB[("PostgreSQL")]
```

**Demo:** Show `backend/prisma/schema.prisma` → point to any service file with a Prisma query.

**Say:** _"Type-safe queries, auto-generated from the schema. No raw SQL. Migrations tracked in `prisma/migrations/`."_

---

## #3 — WebSockets `Major · 2pts`

```mermaid
sequenceDiagram
    Player1->>Server: connect()
    Player2->>Server: connect()
    Player1->>Server: make_move(cell: 4)
    Server->>Player1: game_updated(board)
    Server->>Player2: game_updated(board)
    Note over Player1,Player2: Real-time — no page refresh
```

**Demo:** Two browser windows logged in as different users → make a move → other player sees it instantly → open DevTools WS tab to show socket frames.

**Say:** _"Persistent WebSocket connection — moves, chat, and presence updates are pushed to all clients in real time."_

---

## #4 — User Interaction `Major · 2pts`

```mermaid
flowchart TD
    A["Send friend request"] --> B["Request pending"]
    B --> C["Other user accepts"]
    C --> D["Friends list updated\n+ online status visible"]
    D --> E["Open chat → send message\n→ delivered instantly via Socket.IO"]
```

**Demo:** Send friend request from User A → accept from User B → open chat → send messages both ways → visit each other's profiles.

---

## #5 — User Management `Major · 2pts`

```mermaid
flowchart LR
    A([Sign Up]) --> B[bcrypt hash password]
    B --> C[(Store in DB)]
    C --> D([Log In])
    D --> E[JWT issued]
    E --> F([Edit profile / avatar])
    F --> G([Online status visible\nto friends])
```

**Demo:** Sign up → log in → edit display name + upload avatar → log out → log in again → confirm data persisted.

---

## #6 — Tic-Tac-Toe Game `Major · 2pts` ⚠️ dependency for #7–#11

```mermaid
flowchart TD
    A([Player clicks cell]) --> B{Cell empty?}
    B -->|No| A
    B -->|Yes| C[Place symbol]
    C --> D{Winner?}
    D -->|Yes| E([Show win + highlight line])
    D -->|Draw| F([Show draw screen])
    D -->|No| G[Switch turn] --> A
```

**Demo:** Play a full local game. Show win highlight. Show draw. Show Play Again.

**Say:** _"Server-authoritative win detection — client sends move, server validates and responds with game state."_

---

## #7 — Remote Players `Major · 2pts`

```mermaid
sequenceDiagram
    Player1->>Server: join_room(gameId)
    Player2->>Server: join_room(gameId)
    Server->>Player1: game_started
    Server->>Player2: game_started
    Player1->>Server: make_move(cell: 0)
    Server->>Player1: game_updated
    Server->>Player2: game_updated
    Player1--xServer: disconnects
    Note over Server: 30s forfeit timer starts
    Server->>Player2: opponent_disconnected
```

**Demo:** Two windows play a full online game → mid-game, close one tab → show the forfeit timer → other player wins.

---

## #8 — Tournament `Minor · 1pt`

```mermaid
flowchart TD
    A([Create tournament\n4 or 8 players]) --> B[Players register]
    B --> C{Enough players?}
    C -->|Yes| D[Generate bracket]
    D --> E[Play Round 1 matches]
    E --> F[Winners advance]
    F --> G[Play Final]
    G --> H([Tournament winner declared])
```

**Demo:** Create → register 4 players → start → show bracket view → play matches → show winner.

---

## #9 — AI Opponent `Major · 2pts`

```mermaid
flowchart TD
    A([Player makes move]) --> B[Server receives move]
    B --> C{Difficulty?}
    C -->|Easy| D["50% random\n50% minimax"]
    C -->|Medium| E["20% random\n80% minimax"]
    C -->|Hard| F["Pure minimax\n+ alpha-beta pruning"]
    D & E & F --> G([AI responds with move])
    G --> H{Game over?}
    H -->|No| A
    H -->|Yes| I([Show result])
```

**Demo:** Start AI game → play on Hard → show AI blocking your winning moves → switch to Easy → show it plays weaker.

**Say:** _"Minimax with alpha-beta pruning. Difficulty controls how often it picks a random move instead of the optimal one — makes it feel human."_

---

## #10 — Game Customization `Minor · 1pt`

```mermaid
flowchart LR
    A([Matchmaking / Local Game]) --> B[Setup screen]
    B --> C["ThemeSelector\nClassic · Neon · Retro"]
    B --> D["SymbolSelector\nX/O · Emoji · Initials"]
    C & D --> E[Preferences saved\nto localStorage]
    E --> F([Game starts with\nyour custom theme + symbols])
    F --> G["⚠️ Opponent sees\ntheir own preferences"]
```

**Demo:** Go to Local Game or Matchmaking → pick Neon theme → pick emoji symbols → start game → confirm theme and symbols appear.

---

## #11 — Statistics `Minor · 1pt`

```mermaid
flowchart LR
    G([Game finishes]) --> DB[(Stats updated\nin DB)]
    DB --> P["Profile page\nWins · Losses · Win rate"]
    DB --> L["Leaderboard\nTop players ranked"]
    DB --> H["Match history\nDate · Opponent · Result"]
```

**Demo:** Open your profile → show win/loss stats → open leaderboard → finish a game → refresh → confirm stats updated.

---

## Safety Net

```mermaid
flowchart LR
    A["18pts claimed"] -->|"worst case: #10 or #11 fails"| B["17pts ✅"]
    B -->|"another fails"| C["16pts ✅"]
    C -->|"another fails"| D["15pts ✅"]
    D -->|"another fails"| E["14pts ✅ — still pass"]
```

> We have a **4-point buffer**. Even if 4 minor modules are rejected, we still pass at 14pts.
