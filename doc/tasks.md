# Task List: ft_transcendence

> **How to use this file:** Each task is tagged with a role. Pick tasks matching your role.
> Mark tasks as `[x]` when complete. Add your name next to completed tasks.
> If you're starting a task, change `[ ]` to `[~]` and add your name so others know it's in progress.

---

## Phase 1: Foundation & Infrastructure

### Docker & DevOps — [Tech Lead: mgodawat]

- [x] Create project directory structure — mgodawat
- [x] Write `backend/Dockerfile` — mgodawat
- [x] Write `frontend/Dockerfile` — mgodawat
- [x] Write `docker-compose.yml` (frontend + backend + PostgreSQL) — mgodawat
- [x] Write `Makefile` (make, make up, make down, make fclean, make re, make logs) — mgodawat
- [x] Configure `.env` and `.env.example` — mgodawat
- [x] Configure `.editorconfig` and `.prettierrc` (consistent formatting across editors) — mgodawat
- [x] Verify `make` starts all 3 services — mgodawat
- [x] Set up Git branching strategy and branch protection rules
- [x] Configure ESLint for backend and frontend

### Backend Setup — [Backend: mgodawat]

- [x] Review Express project structure (`backend/src/index.ts`) — mgodawat
- [x] Install dependencies locally (`cd backend && npm install`)
- [x] Review Prisma schema (`backend/prisma/schema.prisma`) — mgodawat
- [x] Run `npx prisma generate` locally (for editor type support)
- [x] Create route file structure: `routes/*.routes.ts` (auth, users, friends, games, chat, tournaments) — mgodawat
- [x] Create controller file structure: `controllers/*.controller.ts` — mgodawat
- [x] Create service file structure: `services/*.service.ts` — mgodawat
- [x] Create middleware directory: `middleware/auth.ts` — mgodawat
- [x] Create shared Prisma client: `lib/prisma.ts` — mgodawat
- [x] Verify backend health check works: `curl -k https://localhost:3000/api/health`

### Frontend Setup — [Frontend: mgodawat]

- [x] Install dependencies locally (`cd frontend && npm install`)
- [x] Review React project structure (`frontend/src/App.tsx`, `main.tsx`) — mgodawat
- [x] Set up React Router with placeholder pages: `/`, `/login`, `/signup`, `/profile`, `/game`, `/tournaments`, `/leaderboard`, `/privacy`, `/terms` — mgodawat
- [x] Create layout shell: Navbar component, Footer component, main content area — mgodawat
- [x] Create frontend service files: `services/*.service.ts` (auth, users, games, friends) — mgodawat
- [x] Create shared TypeScript types: `types/index.ts` (User, Game, Message, Friend, Tournament) — mgodawat
- [x] Create auth context placeholder: `context/AuthContext.tsx` — mgodawat
- [x] Create reusable UI components: Button, Input, Card (TailwindCSS) — mgodawat
- [x] Verify hot-reload works (edit App.tsx, see changes in browser)

### Real-Time Setup — [Real-Time: mgodawat]

- [x] Install dependencies locally (`cd backend && npm install` + `cd frontend && npm install`)
- [x] Study Socket.io docs: `emit()`, `on()`, rooms, namespaces
- [x] Test existing Socket.io connection (already configured in `backend/src/index.ts`)
- [x] Test from frontend: connect to Socket.io, log `connected` in console
- [x] Plan WebSocket event structure document (events for chat + game)

### Project Management — [PM: mgodawat]

- [x] Create GitHub Issues for all Phase 2 tasks
- [x] Set up GitHub Project board (To Do / In Progress / Done / Review)
- [x] Draft Privacy Policy page content
- [x] Draft Terms of Service page content
- [x] Ensure all team members have Docker working

---

## Phase 2: User Authentication & Management

### Backend Auth API — [Backend: tzizi]

- [x] Install bcrypt and jsonwebtoken: `npm install bcrypt jsonwebtoken`
- [x] Install types: `npm install -D @types/bcrypt @types/jsonwebtoken`
- [x] Create `middleware/auth.ts` — JWT token verification middleware
- [x] Create `routes/auth.ts`:
  - [x] `POST /api/auth/signup` — validate input, hash password, create user, return JWT
  - [x] `POST /api/auth/login` — verify email + password, return JWT
  - [x] `GET /api/auth/me` — return current user from JWT (protected route)
- [x] Input validation: email format, password min length (8 chars), username min length (3 chars)
- [x] Error responses: 400 (bad input), 401 (wrong credentials), 409 (email/username taken)

### Frontend Auth Pages — [Frontend: mgodawat]

- [x] Create Login page (`pages/Login.tsx`):
  - [x] Email + password form fields
  - [x] Form validation (required fields, email format)
  - [x] Submit → call `POST /api/auth/login`
  - [x] On success → store JWT, redirect to home
  - [x] On error → display error message
- [x] Create Signup page (`pages/Signup.tsx`):
  - [x] Email + username + password + confirm password fields
  - [x] Form validation (matching passwords, email format, min lengths)
  - [x] Submit → call `POST /api/auth/signup`
  - [x] On success → store JWT, redirect to home
  - [x] On error → display error message
- [x] Create auth context (`context/AuthContext.tsx`):
  - [x] Store current user + JWT token in React state
  - [x] Provide `login()`, `signup()`, `logout()` functions
  - [x] On app load → call `GET /api/auth/me` to restore session
- [x] Create ProtectedRoute wrapper (redirect to `/login` if not authenticated)

### Real-Time Auth — [Real-Time: mgodawat]

- [x] Add JWT authentication to Socket.io connection handshake
- [x] On connect: set user `isOnline = true` in database
- [x] On disconnect: set user `isOnline = false` in database
- [x] Broadcast online status changes to friends

### QA & Testing — [PM: mamahtal, mgodawat, tzizi]

- [x] Test signup flow: valid input, duplicate email, duplicate username, weak password
- [x] Test login flow: valid credentials, wrong password, non-existent email
- [x] Test protected route: with token, without token, expired token
- [x] Report bugs as GitHub Issues

---

## Phase 3: Social Features + Game Board

### Backend — Profiles & Friends — [Backend: mamahtal]

- [x] `GET /api/users/:id` — get user profile (public info: username, avatar, stats, online status)
- [x] `PUT /api/users/me` — update own profile (display name, avatar)
- [x] `POST /api/users/me/avatar` — upload avatar image (store locally, default fallback)
- [x] Serve uploaded avatars as static files (`/uploads/avatars/`)
- [x] `POST /api/friends/request/:userId` — send friend request
- [x] `POST /api/friends/accept/:requestId` — accept friend request
- [x] `DELETE /api/friends/:friendId` — remove friend / reject request
- [x] `GET /api/friends` — list accepted friends with online status
- [x] `GET /api/friends/requests` — list pending incoming requests

### Frontend — Profiles & Friends — [Frontend: zamgar]

- [x] Profile page (`pages/Profile.tsx`):
  - [x] Display: avatar, username, display name, online status, join date
  - [x] Edit mode: change display name, upload avatar
  - [x] Avatar upload with preview before saving
- [x] Friends list component:
  - [x] Show friends with online/offline indicator (green/gray dot) — mgodawat
  - [x] "Remove friend" button — mgodawat
- [x] Friend request UI: — mgodawat
  - [x] "Add Friend" button on other users' profiles — mgodawat
  - [x] Pending requests list (accept / reject buttons) — mgodawat
- [ ] User search: search input to find users by username

### Backend + Frontend — Chat — [Real-Time: zamgar, tzizi, mgodawat]

- [x] Socket.io events: `send_message` (client → server), `receive_message` (server → client)
- [x] `typing` indicator event (`typing` client → server, `user_typing` server → client with userId, username, isTyping) — mgodawat
- [x] Store messages in database (Messages table via Prisma)
- [x] `GET /api/messages/:userId` — load chat history with a specific user (paginated)
- [x] `GET /api/messages/conversations` — conversation list with last message + unread count per partner — mgodawat
- [x] Frontend chat sidebar/overlay — mgodawat (PR #119):
  - [x] Chat list: friends you've messaged (sorted by most recent) — `ConversationList.tsx` + `ConversationItem.tsx`
  - [x] Message thread: scrollable, auto-scroll to bottom on new message — `MessageThread.tsx`
  - [x] Message input with send button — `MessageInput.tsx`
  - [x] Typing indicator ("User is typing...") — integrated in `MessageThread.tsx`
  - [x] Connect Socket.io client to backend for real-time messages
  - [x] Floating chat widget (messenger-style popup, bottom-right) — `ChatWidget.tsx` + `ChatContext.tsx`
  - [x] Message button on friends list opens widget directly to that conversation

### Frontend — Game Board Start — [Frontend: zamgar]

- [x] Create Tic-Tac-Toe board component (`components/GameBoard.tsx`):
  - [x] 3x3 CSS grid of clickable cells
  - [x] Each cell displays: empty, "X", or "O"
  - [x] Click handler: call `onCellClick(cellIndex)`
  - [x] Visual feedback: hover effect on empty cells, cursor pointer
  - [x] Current turn indicator: "Your turn (X)" or "Waiting for opponent (O)"

### QA & Testing — [PM: mgodawat]

- [ ] Test profile view and edit flows
- [x] Test friend request flow end-to-end — mgodawat
- [x] Test chat between two users (two browser windows) — mgodawat
- [x] Finalize Privacy Policy and Terms of Service React pages — mgodawat (Issue #63)
- [x] Link Privacy Policy and ToS from footer component — mgodawat (Issue #63)

### Modules Progressed

- Module #4 — User Interaction (chat + profiles + friends): **In Progress**
- Module #5 — Standard User Management: **Completed**
- Module #6 — Web-based Game: **Started**

---

## Phase 4: Game Complete + Multiplayer

### Backend — Game Logic — [Backend: mamahtal, tzizi]

- [x] Game state model: `{ board: [9 cells], currentTurn: "X"|"O", status, winner }`
- [x] Move validation function: is it this player's turn? Is the cell empty? Is the game active?
- [x] Win detection function: check 8 winning lines → return winner or null
- [x] Draw detection: all 9 cells filled, no winner
- [x] `POST /api/games` — create new game
- [x] `POST /api/games/:id/move` — make a move (REST fallback)
- [ ] `GET /api/games/:id` — get current game state
- [x] Save completed game to database (winner, final board, timestamps)

### Frontend — Game UI Complete — [Frontend: zamgar, mgodawat]

- [ ] Game states: waiting (for opponent), playing, finished (win), finished (draw)
- [ ] Win display: highlight the 3 winning cells, show "X wins!" or "O wins!"
- [ ] Draw display: "It's a draw!"
- [ ] Game over screen: winner display, "Play Again" button, "Back to Lobby" button
- [ ] Pre-game lobby page (`pages/GameLobby.tsx`):
  - [ ] "Play Local" (two players, same screen)
  - [ ] "Play Online" (matchmaking)
  - [ ] "Play vs AI" (with difficulty selector)
- [ ] Local game mode: alternate turns on same screen

### Backend + Frontend — Multiplayer — [Real-Time: teammate_3]

- [ ] Matchmaking: `find_game` event → add to queue → match two players → create room
- [ ] Cancel matchmaking: `cancel_search` event
- [ ] Game room: both players join a Socket.io room named by game ID
- [ ] `make_move` event: client sends `{ gameId, cell }` → server validates → updates state
- [ ] `game_update` event: server broadcasts updated board to both players in room
- [ ] `game_over` event: server sends final result (winner or draw)
- [ ] Disconnection handling:
  - [ ] If player disconnects during game → wait 30 seconds → forfeit
  - [ ] Show "Opponent disconnected, waiting for reconnection..." message
- [ ] Reconnection: player rejoins room, receives current game state
- [ ] Matchmaking UI: "Searching for opponent..." with cancel button

### QA & Testing — [PM: teammate_4]

- [ ] Test local game: all win conditions (rows, columns, diagonals), draw
- [ ] Test multiplayer: two browsers, full game to completion
- [ ] Test disconnection: close one browser, verify other sees message
- [ ] Test reconnection: reopen browser, verify game resumes

### Modules Progressed

- Module #3 — Real-time WebSockets: **Completed**
- Module #6 — Web-based Tic-Tac-Toe Game: **Completed**
- Module #7 — Remote Players: **Completed**

---

## Phase 5: Bonus Modules (Day 5)

### Tournament System (Module #8 — 1pt) — [Backend: teammate_2 + PM: teammate_4]

- [ ] Prisma: Tournaments + TournamentParticipants tables (already in schema)
- [ ] `POST /api/tournaments` — create tournament (name, max players: 4 or 8)
- [ ] `POST /api/tournaments/:id/join` — register for tournament
- [ ] `GET /api/tournaments` — list tournaments (filterable by status)
- [ ] `GET /api/tournaments/:id` — get tournament details + bracket
- [ ] Auto-generate bracket when registration full (power of 2 seeding)
- [ ] After each match: advance winner to next round
- [ ] Determine tournament champion
- [ ] Frontend — Tournament list page (available, in progress, completed)
- [ ] Frontend — Tournament detail page with visual bracket
- [ ] Frontend — Registration button
- [ ] Socket.io — Notify player when it's their turn in tournament

### AI Opponent (Module #9 — 2pts) — [Backend: teammate_2]

- [ ] Implement Minimax algorithm:
  - [ ] Evaluate board: +10 if AI wins, -10 if player wins, 0 for draw
  - [ ] Recursively check all possible moves
  - [ ] Return the move with the best score
- [ ] Add alpha-beta pruning (optimization — optional but recommended)
- [ ] Difficulty levels:
  - [ ] Easy: 50% random moves, 50% minimax
  - [ ] Medium: 20% random moves, 80% minimax
  - [ ] Hard: 100% minimax (unbeatable)
- [ ] AI game flow: player makes move → server runs AI → server responds with AI move
- [ ] Frontend — "Play vs AI" with difficulty selector (Easy / Medium / Hard)
- [ ] Verify: AI wins sometimes on Easy, often on Medium, always draws or wins on Hard

### Game Customization (Module #10 — 1pt) — [Frontend: teammate_1]

- [ ] Pre-game settings panel:
  - [ ] Theme selector: Classic (black/white), Neon (dark bg + glowing lines), Retro (pixel art style)
  - [ ] Symbol selector: X/O (default), custom emoji pairs, or initials
  - [ ] Board size: 3x3 (default), 4x4 (win = 4 in a row), 5x5 (win = 4 in a row)
- [ ] Store settings in game record (JSON field in database)
- [ ] Apply settings during gameplay (colors, symbols, grid size)
- [ ] Default options clearly available (subject requirement)
- [ ] If AI module is implemented, AI must work with custom settings

### Game Statistics & Match History (Module #11 — 1pt) — [Frontend: teammate_1 + Backend: teammate_2]

- [ ] `GET /api/users/:id/stats` — wins, losses, draws, win rate, total games
- [ ] `GET /api/users/:id/matches` — paginated match history (most recent first)
- [ ] `GET /api/leaderboard` — top players sorted by wins
- [ ] Frontend — Stats section on profile page (wins, losses, draws, win rate percentage)
- [ ] Frontend — Match history list (date, opponent name, result: W/L/D, game mode)
- [ ] Frontend — Leaderboard page (rank, username, avatar, wins, losses)

### Modules Progressed

- Module #8 — Tournament: **Completed**
- Module #9 — AI Opponent: **Completed**
- Module #10 — Customization: **Completed**
- Module #11 — Statistics: **Completed**

---

## Phase 6: Integration & Bug Fixing (Day 6)

### All Team Members

- [ ] Fix bugs reported during Day 5 testing
- [ ] Cross-test each other's features (each person tests a feature they didn't build)
- [ ] Edge cases:
  - [ ] What if both players disconnect from a game?
  - [ ] What if a tournament has odd number of players? (bye system)
  - [ ] What if user submits empty form fields?
  - [ ] What if user tries to make a move out of turn?
  - [ ] What if the same user opens two browser tabs?
- [ ] Remove all `console.log` statements from production code
- [ ] Check responsive design: desktop, tablet, mobile screen sizes
- [ ] Ensure all API errors return proper status codes and messages
- [ ] Ensure all forms validate on both frontend AND backend

---

## Phase 7: Mandatory Checks & Submission (Day 7)

### Subject Mandatory Requirements — [All]

- [ ] Privacy Policy page — written, relevant content, linked from footer (teammate_4)
- [ ] Terms of Service page — written, relevant content, linked from footer (teammate_4)
- [ ] HTTPS setup — self-signed certificate for all backend communication (mgodawat)
- [ ] Zero console errors or warnings in Chrome (all — open DevTools and check)
- [ ] All forms validate on frontend AND backend (all)
- [ ] `.env` is in `.gitignore`, `.env.example` is committed (mgodawat)
- [ ] Responsive design works at different screen sizes (teammate_1)
- [ ] Multi-user support: 2+ browsers simultaneously, no conflicts (teammate_3)

### Final Testing — [All]

- [ ] Clean Docker test: `make fclean && make` from scratch on a clean machine
- [ ] Full user flow: signup → login → edit profile → upload avatar → add friend → chat → play game
- [ ] Multiplayer test: two browsers, remote game, verify turn sync works
- [ ] AI test: play vs bot on each difficulty, verify appropriate challenge level
- [ ] Tournament test: create → join (enough players) → play through bracket → winner declared
- [ ] Customization test: change theme + symbols, verify they apply in game
- [ ] Statistics test: play a few games, verify stats update on profile
- [ ] Leaderboard test: verify it shows correct rankings

### Documentation — [Tech Lead + PM]

- [ ] Update README.md with final feature list and completion status
- [ ] Update README.md individual contributions section (each person writes their own)
- [ ] Update README.md module justifications (each module owner writes theirs)
- [ ] Update this task list with completion status
- [ ] Verify README has all required sections per Subject Chapter VI
- [ ] **Each team member can explain their code during evaluation**

---

## Quick Reference: Module Dependencies

```
Module #1 (Frameworks) ─────┬───▶ Module #3 (WebSockets) ───▶ Module #7 (Remote Players)
                            │
Module #2 (ORM) ────────────┤
                            │
                            ├───▶ Module #5 (User Mgmt) ────▶ Module #4 (User Interaction)
                            │
                            └───▶ Module #6 (Tic-Tac-Toe) ──┬──▶ Module #7 (Remote Players)
                                                             ├──▶ Module #8 (Tournament)
                                                             ├──▶ Module #9 (AI Opponent)
                                                             ├──▶ Module #10 (Customization)
                                                             └──▶ Module #11 (Statistics)
```

## Quick Reference: Who Does What

| Team Member | Primary Focus                 | Key Deliverables                                       |
| :---------- | :---------------------------- | :----------------------------------------------------- |
| mgodawat    | Infrastructure + Architecture | Docker, HTTPS, code reviews, tech decisions            |
| teammate_1  | Frontend UI                   | React pages, game board, TailwindCSS, customization UI |
| tzizi       | Backend Logic                 | Express API, auth, Prisma, AI opponent, tournament     |
| teammate_3  | Real-Time Features            | Socket.io, multiplayer sync, chat, online status       |
| teammate_4  | Project Management + QA       | GitHub Issues, testing, Privacy Policy, ToS, README    |
