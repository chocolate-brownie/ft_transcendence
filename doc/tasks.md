# Task List: ft_transcendence

> **How to use this file:** Each task is tagged with a role. Pick tasks matching your role.
> Mark tasks as `[x]` when complete. Add your name next to completed tasks.
> If you're starting a task, change `[ ]` to `[~]` and add your name so others know it's in progress.

---

## Phase 1: Foundation & Infrastructure (Day 1)

### Docker & DevOps

- [x] **[Tech Lead]** Install Docker & Docker Compose (if needed)
- [x] **[Tech Lead]** Create project directory structure
- [x] **[Tech Lead]** Write `backend/Dockerfile` (Node.js + TypeScript)
- [x] **[Tech Lead]** Write `frontend/Dockerfile` (Node.js + Vite)
- [x] **[Tech Lead]** Write `docker-compose.yml` (frontend + backend + PostgreSQL)
- [x] **[Tech Lead]** Configure `.env` and `.env.example` (DB creds, JWT secret, ports)
- [x] **[Tech Lead]** Verify `docker compose up --build` starts all 3 services

### Backend Setup

- [ ] **[Backend]** Initialize Express project with TypeScript (`npm init`, tsconfig, etc.)
- [ ] **[Backend]** Create basic Express server (`src/index.ts`) with health check route
- [ ] **[Backend]** Install and configure Prisma ORM with PostgreSQL connection
- [ ] **[Backend]** Create initial Prisma schema (Users table)
- [ ] **[Backend]** Run first Prisma migration
- [ ] **[Backend]** Configure CORS for frontend communication
- [ ] **[Backend]** Install and configure ESLint + Prettier

### Frontend Setup

- [ ] **[Frontend]** Initialize React project with Vite (`npm create vite@latest`)
- [ ] **[Frontend]** Install and configure TailwindCSS
- [ ] **[Frontend]** Create basic App component with routing (React Router)
- [ ] **[Frontend]** Create layout shell (navbar, footer, main content area)
- [ ] **[Frontend]** Verify hot-reload works inside Docker

### ✅ Modules Progressed

- Module #1 — Web Frameworks (React + Express): **In Progress**
- Module #2 — ORM (Prisma): **In Progress**

---

## Phase 2: User Authentication & Management (Day 2)

### Database

- [ ] **[Backend]** Expand Prisma schema: Users (email, username, password_hash, avatar_url, display_name, is_online, created_at, updated_at)
- [ ] **[Backend]** Run Prisma migration for Users table

### Backend Auth API

- [ ] **[Backend]** Install bcrypt and jsonwebtoken packages
- [ ] **[Backend]** Create auth middleware (JWT token verification)
- [ ] **[Backend]** `POST /api/auth/signup` — validate input, hash password, create user, return JWT
- [ ] **[Backend]** `POST /api/auth/login` — verify credentials, return JWT
- [ ] **[Backend]** `GET /api/auth/me` — return current user from JWT (protected route)
- [ ] **[Backend]** `POST /api/auth/logout` — invalidate token (optional: token blacklist)
- [ ] **[Backend]** Input validation middleware (email format, password strength, username rules)

### Frontend Auth Pages

- [ ] **[Frontend]** Create Login page (email + password form)
- [ ] **[Frontend]** Create Signup page (email + username + password + confirm password)
- [ ] **[Frontend]** Store JWT in memory (not localStorage for security)
- [ ] **[Frontend]** Create auth context/provider (React Context for user state)
- [ ] **[Frontend]** Create protected route wrapper (redirect to login if not authenticated)
- [ ] **[Frontend]** Form validation (matching passwords, email format, required fields)
- [ ] **[Frontend]** Error display (wrong credentials, email taken, etc.)

### ✅ Modules Progressed

- Module #5 — Standard User Management: **In Progress**

---

## Phase 3: Profiles, Friends & Chat (Day 3)

### Database

- [ ] **[Backend]** Add Prisma schema: Friends table (requester_id, addressee_id, status)
- [ ] **[Backend]** Add Prisma schema: Messages table (sender_id, receiver_id, content, read, created_at)
- [ ] **[Backend]** Run Prisma migration

### Backend API — Profiles

- [ ] **[Backend]** `GET /api/users/:id` — get user profile (public info)
- [ ] **[Backend]** `PUT /api/users/me` — update own profile (display name, avatar)
- [ ] **[Backend]** `POST /api/users/me/avatar` — upload avatar image (with default fallback)
- [ ] **[Backend]** Serve uploaded avatars as static files

### Backend API — Friends

- [ ] **[Backend]** `POST /api/friends/request/:userId` — send friend request
- [ ] **[Backend]** `POST /api/friends/accept/:requestId` — accept friend request
- [ ] **[Backend]** `DELETE /api/friends/:friendId` — remove friend
- [ ] **[Backend]** `GET /api/friends` — list friends with online status
- [ ] **[Backend]** `GET /api/friends/requests` — list pending friend requests

### Backend — Chat (Socket.io)

- [ ] **[Backend]** Install and configure Socket.io with Express
- [ ] **[Backend]** Authentication middleware for Socket.io (verify JWT on connection)
- [ ] **[Backend]** Chat events: `send_message`, `receive_message`, `typing`
- [ ] **[Backend]** Store messages in database
- [ ] **[Backend]** Track online status (update on connect/disconnect)

### Frontend — Profiles

- [ ] **[Frontend]** Create Profile page (view mode: username, avatar, stats, online status)
- [ ] **[Frontend]** Create Profile edit form (display name, avatar upload)
- [ ] **[Frontend]** Avatar upload with preview

### Frontend — Friends

- [ ] **[Frontend]** Friends list component (with online/offline indicators)
- [ ] **[Frontend]** Friend request send button (on profile pages)
- [ ] **[Frontend]** Pending requests list (accept/reject)
- [ ] **[Frontend]** User search to find and add friends

### Frontend — Chat

- [ ] **[Frontend]** Chat sidebar or overlay component
- [ ] **[Frontend]** Message list (scrollable, auto-scroll to bottom)
- [ ] **[Frontend]** Message input with send button
- [ ] **[Frontend]** Connect Socket.io client to backend
- [ ] **[Frontend]** Show chat history from database

### ✅ Modules Progressed

- Module #4 — User Interaction (chat + profiles + friends): **In Progress**
- Module #5 — Standard User Management: **Completed**

---

## Phase 4: Pong Game — Local (Day 4)

### Game Engine

- [ ] **[Game Dev]** Create HTML5 Canvas React component
- [ ] **[Game Dev]** Implement game loop using `requestAnimationFrame`
- [ ] **[Game Dev]** Render game objects: ball, two paddles, center line, scores
- [ ] **[Game Dev]** Ball physics: movement, wall bouncing (top/bottom), speed increase over time
- [ ] **[Game Dev]** Paddle physics: movement within boundaries, collision with ball
- [ ] **[Game Dev]** Keyboard input: Player 1 (W/S), Player 2 (Up/Down arrows)
- [ ] **[Game Dev]** Scoring: detect ball passing paddle, increment score, reset ball
- [ ] **[Game Dev]** Win condition (first to 5 or 11 points)
- [ ] **[Game Dev]** Game states: waiting, countdown, playing, paused, game over
- [ ] **[Game Dev]** Game over screen with winner display and "Play Again" button

### Frontend Integration

- [ ] **[Frontend]** Game page with canvas centered
- [ ] **[Frontend]** Pre-game lobby (choose local vs online vs AI)
- [ ] **[Frontend]** In-game UI (scores, timer, pause button)

### ✅ Modules Progressed

- Module #6 — Web-based Pong Game: **In Progress**

---

## Phase 5: Multiplayer & Real-Time (Day 5)

### Server-Side Game Logic

- [ ] **[Backend]** Game room management (create, join, leave, list)
- [ ] **[Backend]** Server-side game state (authoritative — server controls ball position)
- [ ] **[Backend]** WebSocket events: `join_game`, `player_input`, `game_state_update`, `game_over`
- [ ] **[Backend]** Matchmaking queue (wait for opponent, auto-match)
- [ ] **[Backend]** Handle player disconnection (pause game, timeout, forfeit)
- [ ] **[Backend]** Handle player reconnection (resume game)
- [ ] **[Backend]** Save completed game to database (Games table)

### Frontend Multiplayer

- [ ] **[Frontend]** Matchmaking UI (searching for opponent, cancel search)
- [ ] **[Frontend]** Receive game state from server, render on canvas
- [ ] **[Frontend]** Send player input to server (not local paddle movement)
- [ ] **[Frontend]** Client-side interpolation for smooth rendering
- [ ] **[Frontend]** Disconnection handling (show reconnecting message)
- [ ] **[Frontend]** Game result screen (win/loss, option to rematch)

### Database

- [ ] **[Backend]** Add Prisma schema: Games table (players, scores, winner, mode, settings, timestamps)
- [ ] **[Backend]** Run Prisma migration

### ✅ Modules Progressed

- Module #3 — Real-time WebSockets: **Completed**
- Module #6 — Web-based Pong Game: **Completed**
- Module #7 — Remote Players: **Completed**

---

## Phase 6: Bonus Modules (Day 6)

### Tournament System (Module #8 — 1pt)

- [ ] **[Backend]** Add Prisma schema: Tournaments, TournamentParticipants tables
- [ ] **[Backend]** `POST /api/tournaments` — create tournament (name, max players)
- [ ] **[Backend]** `POST /api/tournaments/:id/join` — register for tournament
- [ ] **[Backend]** `GET /api/tournaments` — list tournaments
- [ ] **[Backend]** `GET /api/tournaments/:id` — get tournament bracket/details
- [ ] **[Backend]** Auto-generate bracket when tournament starts
- [ ] **[Backend]** Progress bracket: after each match, advance winner
- [ ] **[Backend]** Determine tournament winner
- [ ] **[Frontend]** Tournament list page (available, in progress, completed)
- [ ] **[Frontend]** Tournament detail page with visual bracket
- [ ] **[Frontend]** Tournament registration button
- [ ] **[Frontend]** Auto-redirect to game when it's your turn

### AI Opponent (Module #9 — 2pts)

- [ ] **[Game Dev]** Create AI paddle controller on the server side
- [ ] **[Game Dev]** AI tracks ball Y position with prediction
- [ ] **[Game Dev]** Add reaction delay (AI doesn't instantly move to ball)
- [ ] **[Game Dev]** Add random offset (AI occasionally misjudges position)
- [ ] **[Game Dev]** Difficulty levels: Easy (high offset, slow reaction), Medium, Hard (low offset, fast reaction)
- [ ] **[Frontend]** "Play vs AI" option in game lobby with difficulty selector
- [ ] **[Game Dev]** Verify: AI wins some games but not all, behaves human-like

### Game Customization (Module #10 — 1pt)

- [ ] **[Frontend]** Pre-game settings panel:
  - [ ] Paddle color picker (at least 4 color options)
  - [ ] Ball speed selector (slow / normal / fast)
  - [ ] Map theme selector (at least 2 themes: classic dark, retro neon)
- [ ] **[Backend]** Store game settings in Games table (JSON field)
- [ ] **[Game Dev]** Apply settings during gameplay (colors, speed, background)
- [ ] **[Frontend]** Default options clearly available (subject requirement)

### Game Statistics & Match History (Module #11 — 1pt)

- [ ] **[Backend]** `GET /api/users/:id/stats` — wins, losses, win rate, total games
- [ ] **[Backend]** `GET /api/users/:id/matches` — paginated match history
- [ ] **[Backend]** `GET /api/leaderboard` — top players by wins
- [ ] **[Frontend]** Stats section on user profile page
- [ ] **[Frontend]** Match history page (date, opponent, score, result, game mode)
- [ ] **[Frontend]** Leaderboard page (ranking, username, wins, losses)
- [ ] **[Frontend]** Achievement badges (optional: "First Win", "10 Wins", "Tournament Champion")

---

## Phase 7: Mandatory Checks & Submission (Day 7)

### Subject Mandatory Requirements

- [ ] **[All]** Privacy Policy page — written, relevant content, linked from footer
- [ ] **[All]** Terms of Service page — written, relevant content, linked from footer
- [ ] **[Tech Lead]** HTTPS setup (self-signed cert for development)
- [ ] **[Tech Lead]** Verify: no console errors or warnings in Chrome
- [ ] **[All]** Verify: all forms validate on frontend AND backend
- [ ] **[Tech Lead]** Verify: `.env` is in `.gitignore`, `.env.example` is committed
- [ ] **[Tech Lead]** Verify: responsive design (test at different window sizes)
- [ ] **[Tech Lead]** Verify: multi-user support (open 2+ browsers, both work simultaneously)

### Final Testing

- [ ] **[Tech Lead]** Clean Docker test: `docker compose down -v && docker compose up --build`
- [ ] **[All]** Full user flow test: signup → login → edit profile → add friend → chat → play game
- [ ] **[All]** Multiplayer test: two browsers, remote game, verify sync
- [ ] **[All]** AI test: play vs bot, verify it wins sometimes and loses sometimes
- [ ] **[All]** Tournament test: create → join → play through → winner declared
- [ ] **[PM]** Verify all module functionality matches subject requirements

### Documentation

- [ ] **[Tech Lead]** Update README.md with final feature list, contributions, and module justifications
- [ ] **[Tech Lead]** Update this task list with completion status
- [ ] **[PM]** Verify README has all required sections (Subject Chapter VI)
- [ ] **[All]** Each team member can explain their contributions (evaluation prep)

---

## Quick Reference: Module Dependencies

```
Module #1 (Frameworks) ─────┬───▶ Module #3 (WebSockets) ───▶ Module #7 (Remote Players)
                            │
Module #2 (ORM) ────────────┤
                            │
                            ├───▶ Module #5 (User Mgmt) ────▶ Module #4 (User Interaction)
                            │
                            └───▶ Module #6 (Pong Game) ────┬──▶ Module #7 (Remote Players)
                                                            ├──▶ Module #8 (Tournament)
                                                            ├──▶ Module #9 (AI Opponent)
                                                            ├──▶ Module #10 (Customization)
                                                            └──▶ Module #11 (Statistics)
```
