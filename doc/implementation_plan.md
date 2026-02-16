# Implementation Plan — ft_transcendence

## Goal: Multiplayer Tic-Tac-Toe with Social Features (18 Points Target)

This plan outlines the strategy to build a multiplayer Tic-Tac-Toe platform, adhering to the 42 subject requirements and securing 18 evaluation points (14 core + 4 safety buffer).

---

## Team Roles (Ref: Subject II.1.1)

With 5 team members, roles are fully specialized as recommended by the subject.

| Role                                          | Assigned To  | Responsibilities                                                      |
| :-------------------------------------------- | :----------- | :-------------------------------------------------------------------- |
| **Tech Lead / Architect**                     | mgodawat     | Docker, repo structure, tech stack decisions, HTTPS, code reviews     |
| **Frontend Developer / UI Designer**          | [teammate_1] | React pages, TailwindCSS, game board UI, responsive design            |
| **Backend Developer**                         | [teammate_2] | Express API, auth, Prisma, AI opponent, tournament logic              |
| **Fullstack / Real-Time Specialist**          | [teammate_3] | Socket.io gateway, multiplayer sync, chat, real-time features         |
| **Product Owner (PO) / Project Manager (PM)** | [teammate_4] | Requirements, task tracking, QA, Privacy Policy, ToS, evaluation prep |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                       │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Frontend   │  │   Backend    │  │  PostgreSQL  │   │
│  │   (React +   │  │  (Express +  │  │  (Database)  │   │
│  │    Vite)     │──│  Socket.io)  │──│              │   │
│  │  Port: 5173  │  │  Port: 3000  │  │  Port: 5432  │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│         │                  │                            │
│         └──── WebSocket ───┘                            │
│           (turn-based sync                              │
│            + real-time chat)                            │
└─────────────────────────────────────────────────────────┘
```

**Tech Stack:**

| Layer     | Technology                 | Why                                              |
| :-------- | :------------------------- | :----------------------------------------------- |
| Frontend  | React (Vite) + TailwindCSS | Component-based, fast dev server, huge ecosystem |
| Backend   | Express + TypeScript       | Minimal boilerplate, beginner-friendly, flexible |
| Database  | PostgreSQL + Prisma ORM    | Relational integrity, type-safe queries          |
| Real-Time | Socket.io                  | Bidirectional WebSocket communication            |
| Auth      | JWT + bcrypt               | Stateless sessions, secure password hashing      |
| DevOps    | Docker + Docker Compose    | Single-command deployment                        |

---

## Why Tic-Tac-Toe Instead of Pong

Tic-Tac-Toe earns the same module points as Pong but is dramatically simpler to implement:

| Aspect         | Pong                            | Tic-Tac-Toe                           |
| :------------- | :------------------------------ | :------------------------------------ |
| Rendering      | Canvas API, 60fps animation     | 9 HTML div elements in a CSS grid     |
| Game physics   | Ball velocity, collision math   | None — click a cell, place X or O     |
| Game logic     | Continuous real-time simulation | Check 8 winning lines after each move |
| Network sync   | Continuous state at 60Hz        | One message per turn                  |
| AI opponent    | Paddle tracking heuristic       | Minimax algorithm (~20 lines)         |
| Input handling | Continuous keyboard events      | Single click event per turn           |

This lets the team focus on delivering polished auth, chat, profiles, and tournament features instead of struggling with game physics.

---

## Module Strategy (18 Points)

### Core Modules (14 Points — MUST complete)

| #   | Module                                       | Pts | Days | Owner(s)               | Dependencies |
| :-- | :------------------------------------------- | :-- | :--- | :--------------------- | :----------- |
| 1   | Web frameworks (React + Express)             | 2   | 1    | All                    | None         |
| 2   | Prisma ORM                                   | 1   | 1    | teammate_2             | None         |
| 3   | Real-time WebSockets                         | 2   | 3–5  | teammate_3             | #1           |
| 4   | User interaction (chat + profiles + friends) | 2   | 3–4  | teammate_1, teammate_3 | #1, #5       |
| 5   | Standard user management                     | 2   | 2–3  | mgodawat, teammate_2   | #1, #2       |
| 6   | Web-based Tic-Tac-Toe game                   | 2   | 4–6  | teammate_1, teammate_3 | #1           |
| 7   | Remote players                               | 2   | 5–6  | teammate_3             | #3, #6       |
| 8   | Tournament system                            | 1   | 7–8  | teammate_2, teammate_4 | #6           |

### Bonus Modules (4 Points — implement after core is stable)

| #   | Module                          | Pts | Days | Owner(s)               | Dependencies |
| :-- | :------------------------------ | :-- | :--- | :--------------------- | :----------- |
| 9   | AI Opponent                     | 2   | 8–9  | teammate_2             | #6           |
| 10  | Game customization              | 1   | 8–9  | teammate_1             | #6           |
| 11  | Game statistics & match history | 1   | 9–10 | teammate_1, teammate_2 | #5, #6       |

### Drop Strategy

If running out of time, drop in reverse order: #11 → #10 → #9 → #8. This keeps you at 14 points minimum.

---

## 15-Day Development Timeline

- **Days 1–7:** Core feature development
- **Days 8–10:** Bonus modules, polish, and integration
- **Days 11–15:** Debugging, heavy testing, and submission prep

### Day 1 — Foundation (All Hands)

**Goal:** Docker runs, frontend and backend respond, database connects. Everyone has local dev environment working.

**mgodawat (Tech Lead):**

- Verify Docker setup works for all team members
- Fix any OS-specific Docker issues (SELinux, permissions, etc.)
- Set up Git branching strategy (feature branches → main)
- Configure ESLint + Prettier for consistent code style

**teammate_1 (Frontend):**

- Install dependencies locally (`cd frontend && npm install`)
- Understand React project structure (main.tsx → App.tsx → pages/ → components/ → services/ → types/)
- ~~Create layout shell~~ ✅ Done (Navbar, Footer, Layout with React Router)
- ~~Set up React Router with placeholder pages~~ ✅ Done (all routes configured in App.tsx)
- Create reusable UI components: Button, Input, Card (TailwindCSS)

**teammate_2 (Backend):**

- Install dependencies locally (`cd backend && npm install`)
- Understand Express project structure (index.ts → routes/ → controllers/ → services/ → middleware/)
- Review Prisma schema, run `npx prisma generate` locally
- ~~Create route file structure~~ ✅ Done (routes/, controllers/, services/, middleware/, lib/)

**teammate_3 (Fullstack/Real-Time):**

- Set up local dev environment
- Study Socket.io docs — understand `emit()`, `on()`, rooms, namespaces
- Test existing Socket.io connection (already in index.ts)
- Plan WebSocket event structure for chat and game

**teammate_4 (PO/PM):**

- Create GitHub Issues for all Phase 2 tasks
- Set up GitHub Project board (To Do / In Progress / Done)
- Write Privacy Policy page content (draft)
- Write Terms of Service page content (draft)

**Modules progressed:** #1 (Web frameworks), #2 (ORM)

---

### Day 2 — User Authentication & Management

**Goal:** Users can sign up, log in, view and edit their profile.

**mgodawat (Tech Lead):**

- Review all PRs and code quality
- Implement HTTPS self-signed certificate configuration
- Help debug any Docker/environment issues

**teammate_1 (Frontend):**

- Build Login page (email + password form, validation, error display)
- Build Signup page (email + username + password + confirm, validation)
- Build basic Profile page (display user info, edit form)
- Create auth context (React Context to store current user + JWT)
- Create protected route wrapper (redirect to `/login` if not authenticated)

**teammate_2 (Backend):**

- Implement `POST /api/auth/signup` — validate, hash password, create user, return JWT
- Implement `POST /api/auth/login` — verify credentials, return JWT
- Implement `GET /api/auth/me` — return current user from JWT
- Create auth middleware (verify JWT on protected routes)
- Implement `GET /api/users/:id` — get user profile
- Implement `PUT /api/users/me` — update profile (display name, avatar)
- Input validation on all endpoints

**teammate_3 (Fullstack/Real-Time):**

- Add JWT authentication to Socket.io connections
- Implement online status tracking (set online on connect, offline on disconnect)
- Start planning chat message event structure

**teammate_4 (PO/PM):**

- Test signup and login flows, report bugs
- Finalize Privacy Policy page content
- Finalize Terms of Service page content
- Update GitHub Issues with Day 3 tasks

**Modules progressed:** #5 (Standard user management)

---

### Day 3 — Social Features + Game Start

**Goal:** Friends, chat, and profile fully working. Game board rendering starts.

**mgodawat (Tech Lead):**

- Code reviews for all auth + profile PRs
- Help with any integration issues between frontend and backend
- Avatar upload endpoint (file storage + default fallback)

**teammate_1 (Frontend):**

- Friends list component (online/offline indicators)
- Friend request UI (send, accept, reject)
- User search to find and add friends
- Start Tic-Tac-Toe game board component (3x3 grid of clickable cells)
- Game board renders X, O, or empty for each cell

**teammate_2 (Backend):**

- Friends API: `POST /api/friends/request/:userId`, `POST /api/friends/accept/:id`, `DELETE /api/friends/:id`, `GET /api/friends`
- Start game logic: win detection function (check 8 winning lines)
- Game API: `POST /api/games` (create), `GET /api/games/:id` (get state)

**teammate_3 (Fullstack/Real-Time):**

- Chat system: Socket.io events for `send_message`, `receive_message`
- Chat UI: sidebar/overlay with message list, input, send button
- Store messages in database (Messages table)
- Chat history: load previous messages from API on open

**teammate_4 (PO/PM):**

- Test friends and chat features
- Create Privacy Policy and ToS React pages with content
- Link them from footer
- Report bugs and track progress

**Modules progressed:** #4 (User interaction), #5 (completed), #6 (started)

---

### Day 4 — Game Complete + Multiplayer

**Goal:** Tic-Tac-Toe fully playable locally and remotely between two players.

**mgodawat (Tech Lead):**

- Code reviews for game and multiplayer PRs
- Help debug WebSocket synchronization issues
- Ensure game state is server-authoritative (prevent cheating)

**teammate_1 (Frontend):**

- Complete game board: click to place mark, show whose turn it is
- Game states: waiting, playing, finished (win/draw)
- Win animation (highlight winning line)
- Game over screen with winner display and "Play Again" button
- Pre-game lobby: choose local vs online vs AI

**teammate_2 (Backend):**

- Server-side game state management (authoritative — server validates every move)
- Game move validation: correct turn, cell not taken, game not over
- Save completed games to database

**teammate_3 (Fullstack/Real-Time):**

- Matchmaking: `find_game` event → wait for opponent → create room → start game
- Game WebSocket events: `make_move` (client → server), `game_update` (server → clients), `game_over`
- Handle disconnection: pause game, timeout, forfeit
- Handle reconnection: rejoin room, restore game state
- Test: two browser windows can play a full remote game

**teammate_4 (PO/PM):**

- Test multiplayer from two different browsers
- Verify game rules work correctly (all win conditions, draw detection)
- Update task tracker

**Modules progressed:** #3 (Real-time WebSockets), #6 (completed), #7 (Remote players)

---

### Day 5 — Game Polish + Remote Multiplayer

**Goal:** Tic-Tac-Toe fully playable remotely between two players. All core modules feature-complete.

**mgodawat (Tech Lead):**

- Code reviews for game and multiplayer PRs
- Help debug WebSocket synchronization issues
- Ensure game state is server-authoritative (prevent cheating)

**teammate_1 (Frontend):**

- Complete game board polish: turn indicators, win animation, game over screen
- Pre-game lobby: choose local vs online vs AI

**teammate_2 (Backend):**

- Finalize server-side game state validation
- Save completed games to database

**teammate_3 (Fullstack/Real-Time):**

- Matchmaking via WebSocket
- Handle disconnection: pause game, timeout, forfeit
- Handle reconnection: rejoin room, restore game state
- Test: two browser windows can play a full remote game

**teammate_4 (PO/PM):**

- Test multiplayer from two different browsers
- Verify game rules work correctly (all win conditions, draw detection)

**Modules progressed:** #6 (completed), #7 (Remote players)

---

### Day 6 — Core Integration

**Goal:** All core modules (1–7) are feature-complete and integrated.

**All team members:**

- Fix bugs from Day 5 multiplayer testing
- Cross-test each other's features (each person tests a feature they didn't build)
- Verify the full user flow works end-to-end: signup → login → edit profile → add friend → chat → play game

**Modules progressed:** #7 (completed)

---

### Day 7 — Tournament System

**Goal:** Tournament creation, registration, bracket play, and winner declaration.

**teammate_2 (Backend):**

- Tournament API: create, join, list, bracket generation, progression
- Auto-generate bracket when registration full
- After each match: advance winner to next round

**teammate_1 (Frontend):**

- Tournament list page (available, in progress, completed)
- Tournament detail page with visual bracket
- Registration button

**teammate_3 (Fullstack/Real-Time):**

- Tournament WebSocket events: notify when it's your turn in the bracket

**teammate_4 (PO/PM):**

- Test tournament flow end-to-end

**Modules progressed:** #8 (Tournament system)

---

### Days 8–9 — Bonus Modules

**Goal:** AI opponent, game customization, and statistics.

**teammate_2 (Backend):**

- AI opponent: Minimax algorithm with alpha-beta pruning
- AI difficulty: Easy (random moves 50% of time), Medium (random 20%), Hard (pure minimax)
- Statistics API: `GET /api/users/:id/stats`, `GET /api/users/:id/matches`, `GET /api/leaderboard`

**teammate_1 (Frontend):**

- Game customization UI: theme selector (classic/neon/retro), symbol selector (X/O, custom emoji), board size option (3x3, 4x4, 5x5)
- Statistics section on profile page (wins, losses, win rate)
- Match history page (date, opponent, result)
- Leaderboard page (top players by wins)

**teammate_3 (Fullstack/Real-Time):**

- AI game mode: client sends `play_ai` → server creates game → AI responds to each move via WebSocket

**teammate_4 (PO/PM):**

- Test AI plays competently but not perfectly
- Test customization options apply correctly

**mgodawat (Tech Lead):**

- Code reviews
- Performance check: multiple concurrent games

**Modules progressed:** #9 (AI Opponent), #10 (Customization), #11 (Statistics)

---

### Day 10 — Integration + First Bug Pass

**Goal:** All features integrated, initial bug sweep complete.

**All team members:**

- Fix bugs reported during Days 8–9 testing
- Cross-test each other's features
- Handle edge cases: what if both players disconnect? What if tournament has odd number of players? What if user submits empty form?
- Ensure all forms validate on both frontend AND backend
- Check responsive design on different screen sizes

---

### Days 11–13 — Deep Testing + Bug Fixing

**Goal:** Systematic testing of every feature. Find and fix all bugs.

**Testing rotation (so everyone tests everything):**

| Day | teammate_1 tests | teammate_2 tests | teammate_3 tests | teammate_4 tests | mgodawat tests    |
| :-- | :--------------- | :--------------- | :--------------- | :--------------- | :---------------- |
| 11  | Chat + friends   | Game multiplayer | Auth + profiles  | Tournament       | All API endpoints |
| 12  | Tournament       | Auth + profiles  | Game custom.     | Chat + friends   | WebSocket edges   |
| 13  | AI opponent      | Chat + friends   | Tournament       | Multiplayer      | Full user flows   |

**Focus areas:**

- Multi-user concurrency (open 3+ browsers simultaneously)
- Network edge cases (disconnect mid-game, slow connection)
- Input validation (empty fields, XSS attempts, SQL injection attempts)
- Browser console: zero errors, zero warnings
- Responsive design at different screen sizes
- Remove all `console.log` statements from production code

---

### Day 14 — Mandatory Checks

**Goal:** Project passes all subject mandatory requirements.

**Nothing new built — this day is purely for verification.**

- Privacy Policy page: accessible from footer, relevant content (teammate_4)
- Terms of Service page: accessible from footer, relevant content (teammate_4)
- HTTPS working on all endpoints (mgodawat)
- Zero console errors or warnings in Chrome (all)
- All forms validate on frontend AND backend (all)
- `.env` gitignored, `.env.example` committed (mgodawat)
- Responsive design works on different screen sizes (teammate_1)
- Multi-user test: open 2+ browsers, both work simultaneously (all)
- Clean Docker test: `make fclean && make` from scratch (mgodawat)
- Full user flow test: signup → login → edit profile → add friend → chat → play game (all)
- Multiplayer test: two browsers, remote game, verify sync (teammate_3)
- AI test: play vs bot, verify it wins sometimes but not always (teammate_2)
- Tournament test: create → join → play through bracket → winner declared (teammate_4)

---

### Day 15 — Submission Prep

**Goal:** Documentation complete, team ready for evaluation.

- Update README.md with final feature list and completion status (all)
- Update README.md individual contributions section (each person writes their own)
- Update README.md module justifications (each module owner writes theirs)
- Verify README has all required sections per Subject Chapter VI
- Each team member practices explaining their code and contributions
- Final `make fclean && make` test on a clean machine
- **Each team member must be able to explain their contributions during evaluation**

---

## Tic-Tac-Toe Game — Technical Details

### Game State

The game state is a simple array of 9 values (for a 3x3 board):

```
board = [null, null, null,   // cells 0, 1, 2  (top row)
         null, null, null,   // cells 3, 4, 5  (middle row)
         null, null, null]   // cells 6, 7, 8  (bottom row)
```

Each cell is either `null` (empty), `"X"`, or `"O"`.

### Win Detection

Check 8 possible winning lines:

```
Rows:      [0,1,2]  [3,4,5]  [6,7,8]
Columns:   [0,3,6]  [1,4,7]  [2,5,8]
Diagonals: [0,4,8]  [2,4,6]
```

If all three cells in any line contain the same non-null value, that player wins. If all 9 cells are filled with no winner, it's a draw.

### Multiplayer Flow (WebSocket)

```
Player A clicks cell 4
    → Client sends: { event: "make_move", data: { gameId: 123, cell: 4 } }
    → Server validates: correct turn? cell empty? game active?
    → Server updates board: board[4] = "X"
    → Server checks for win/draw
    → Server broadcasts: { event: "game_update", data: { board, currentTurn, winner, status } }
    → Both clients re-render the board
```

One message per turn. Compare this to Pong which would send 60 messages per second.

### AI Opponent (Minimax)

The Minimax algorithm evaluates every possible future game state and picks the optimal move. For Tic-Tac-Toe:

- The AI considers all empty cells
- For each, it simulates the move and recursively evaluates the opponent's best response
- It picks the move with the highest score (win = +10, loss = -10, draw = 0)

To make the AI feel human:

- **Easy:** 50% of moves are random instead of optimal
- **Medium:** 20% random moves
- **Hard:** Pure minimax (unbeatable)

---

## Mandatory Subject Requirements Checklist

These are non-negotiable. Failing any of these = project rejection.

- [ ] Web application with frontend, backend, and database
- [ ] Git with clear commits from all team members
- [ ] Single-command deployment via Docker Compose (`make`)
- [ ] Compatible with latest stable Google Chrome
- [ ] No warnings or errors in browser console
- [ ] Privacy Policy page (accessible, relevant content)
- [ ] Terms of Service page (accessible, relevant content)
- [ ] Multi-user support (concurrent users without conflicts)
- [ ] Frontend is responsive and accessible
- [ ] CSS framework used (TailwindCSS)
- [ ] Credentials stored in .env (gitignored), .env.example provided
- [ ] Database has clear schema with well-defined relations
- [ ] Basic user auth: email + password with hashed/salted passwords
- [ ] All forms validated on both frontend and backend
- [ ] HTTPS used for backend

---

## Teammate Onboarding Guide

1. **Read** this document and the [README.md](../README.md).
2. **Check** [tasks.md](tasks.md) for tasks matching your role.
3. **Setup** your local environment:
   - Clone the repo
   - Copy `.env.example` to `.env`
   - Run `make` (or `docker compose up --build`)
   - Run `cd backend && npm install` and `cd frontend && npm install` (for editor support)
   - Verify frontend at `http://localhost:5173` (should show System Status dashboard with Navbar and Footer)
   - Verify backend at `https://localhost:3000/api/health` (accept self-signed cert warning)
4. **Understand the architecture:**
   - Backend: `index.ts` (server setup) → `routes/` (URLs) → `controllers/` (HTTP handling) → `services/` (business logic)
   - Frontend: `App.tsx` (Router + Layout) → `pages/` (one per route) → `components/` (reusable UI) → `services/` (API calls)
5. **Pick tasks** from [tasks.md](tasks.md) that match your role.
6. **Create a branch** for your feature: `git checkout -b feature/your-feature-name`
7. **Communicate** on Discord before starting any major work.
8. **Push and create a PR** when your feature is ready for review.
