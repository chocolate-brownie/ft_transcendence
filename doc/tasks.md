# Task List: ft_transcendence

> **How to use this file:** Each task is tagged with a role. Pick tasks matching your role.
> Mark tasks as `[x]` when complete. Add your name next to completed tasks.
> If you're starting a task, change `[ ]` to `[~]` and add your name so others know it's in progress.

---

## Phase 1: Foundation & Infrastructure (Day 1)

### Docker & DevOps — [Tech Lead: mgodawat]

- [x] Create project directory structure — mgodawat
- [x] Write `backend/Dockerfile` — mgodawat
- [x] Write `frontend/Dockerfile` — mgodawat
- [x] Write `docker-compose.yml` (frontend + backend + PostgreSQL) — mgodawat
- [x] Write `Makefile` (make, make up, make down, make fclean, make re, make logs) — mgodawat
- [x] Configure `.env` and `.env.example` — mgodawat
- [x] Configure `.editorconfig` and `.prettierrc` (consistent formatting across editors) — mgodawat
- [x] Verify `make` starts all 3 services — mgodawat
- [ ] Set up Git branching strategy and branch protection rules
- [ ] Configure ESLint for backend and frontend

### Backend Setup — [Backend: teammate_2]

- [ ] Review Express project structure (`backend/src/index.ts`)
- [ ] Install dependencies locally (`cd backend && npm install`)
- [ ] Review Prisma schema (`backend/prisma/schema.prisma`)
- [ ] Run `npx prisma generate` locally (for editor type support)
- [ ] Create route file structure: `routes/auth.ts`, `routes/users.ts`, `routes/games.ts`
- [ ] Create middleware directory: `middleware/auth.ts`
- [ ] Verify backend health check works: `curl -k https://localhost:3000/api/health`

### Frontend Setup — [Frontend: teammate_1]

- [ ] Install dependencies locally (`cd frontend && npm install`)
- [ ] Review React project structure (`frontend/src/App.tsx`, `main.tsx`)
- [ ] Install React Router: `npm install react-router-dom`
- [ ] Create layout shell: Navbar component, Footer component, main content area
- [ ] Set up React Router with placeholder pages: `/`, `/login`, `/signup`, `/profile`, `/game`
- [ ] Create reusable UI components: Button, Input, Card (TailwindCSS)
- [ ] Verify hot-reload works (edit App.tsx, see changes in browser)

### Real-Time Setup — [Real-Time: teammate_3]

- [ ] Install dependencies locally (`cd backend && npm install` + `cd frontend && npm install`)
- [ ] Study Socket.io docs: `emit()`, `on()`, rooms, namespaces
- [ ] Test existing Socket.io connection (already configured in `backend/src/index.ts`)
- [ ] Test from frontend: connect to Socket.io, log `connected` in console
- [ ] Plan WebSocket event structure document (events for chat + game)

### Project Management — [PM: teammate_4]

- [ ] Create GitHub Issues for all Phase 2 tasks
- [ ] Set up GitHub Project board (To Do / In Progress / Done / Review)
- [ ] Draft Privacy Policy page content
- [ ] Draft Terms of Service page content
- [ ] Ensure all team members have Docker working

### Modules Progressed

- Module #1 — Web Frameworks (React + Express): **In Progress**
- Module #2 — ORM (Prisma): **In Progress**

---

## Phase 2: User Authentication & Management (Day 2)

### Backend Auth API — [Backend: teammate_2]

- [ ] Install bcrypt and jsonwebtoken: `npm install bcrypt jsonwebtoken`
- [ ] Install types: `npm install -D @types/bcrypt @types/jsonwebtoken`
- [ ] Create `middleware/auth.ts` — JWT token verification middleware
- [ ] Create `routes/auth.ts`:
  - [ ] `POST /api/auth/signup` — validate input, hash password, create user, return JWT
  - [ ] `POST /api/auth/login` — verify email + password, return JWT
  - [ ] `GET /api/auth/me` — return current user from JWT (protected route)
- [ ] Input validation: email format, password min length (8 chars), username min length (3 chars)
- [ ] Error responses: 400 (bad input), 401 (wrong credentials), 409 (email/username taken)

### Frontend Auth Pages — [Frontend: teammate_1]

- [ ] Create Login page (`pages/Login.tsx`):
  - [ ] Email + password form fields
  - [ ] Form validation (required fields, email format)
  - [ ] Submit → call `POST /api/auth/login`
  - [ ] On success → store JWT, redirect to home
  - [ ] On error → display error message
- [ ] Create Signup page (`pages/Signup.tsx`):
  - [ ] Email + username + password + confirm password fields
  - [ ] Form validation (matching passwords, email format, min lengths)
  - [ ] Submit → call `POST /api/auth/signup`
  - [ ] On success → store JWT, redirect to home
  - [ ] On error → display error message
- [ ] Create auth context (`context/AuthContext.tsx`):
  - [ ] Store current user + JWT token in React state
  - [ ] Provide `login()`, `signup()`, `logout()` functions
  - [ ] On app load → call `GET /api/auth/me` to restore session
- [ ] Create ProtectedRoute wrapper (redirect to `/login` if not authenticated)

### Real-Time Auth — [Real-Time: teammate_3]

- [ ] Add JWT authentication to Socket.io connection handshake
- [ ] On connect: set user `isOnline = true` in database
- [ ] On disconnect: set user `isOnline = false` in database
- [ ] Broadcast online status changes to friends

### QA & Testing — [PM: teammate_4]

- [ ] Test signup flow: valid input, duplicate email, duplicate username, weak password
- [ ] Test login flow: valid credentials, wrong password, non-existent email
- [ ] Test protected route: with token, without token, expired token
- [ ] Report bugs as GitHub Issues

### Modules Progressed

- Module #5 — Standard User Management: **In Progress**

---

## Phase 3: Social Features + Game Board (Day 3)

### Backend — Profiles & Friends — [Backend: teammate_2]

- [ ] `GET /api/users/:id` — get user profile (public info: username, avatar, stats, online status)
- [ ] `PUT /api/users/me` — update own profile (display name, avatar)
- [ ] `POST /api/users/me/avatar` — upload avatar image (store locally, default fallback)
- [ ] Serve uploaded avatars as static files (`/uploads/avatars/`)
- [ ] `POST /api/friends/request/:userId` — send friend request
- [ ] `POST /api/friends/accept/:requestId` — accept friend request
- [ ] `DELETE /api/friends/:friendId` — remove friend / reject request
- [ ] `GET /api/friends` — list accepted friends with online status
- [ ] `GET /api/friends/requests` — list pending incoming requests

### Frontend — Profiles & Friends — [Frontend: teammate_1]

- [ ] Profile page (`pages/Profile.tsx`):
  - [ ] Display: avatar, username, display name, online status, join date
  - [ ] Edit mode: change display name, upload avatar
  - [ ] Avatar upload with preview before saving
- [ ] Friends list component:
  - [ ] Show friends with online/offline indicator (green/gray dot)
  - [ ] "Remove friend" button
- [ ] Friend request UI:
  - [ ] "Add Friend" button on other users' profiles
  - [ ] Pending requests list (accept / reject buttons)
- [ ] User search: search input to find users by username

### Backend + Frontend — Chat — [Real-Time: teammate_3]

- [ ] Socket.io events: `send_message` (client → server), `receive_message` (server → client)
- [ ] `typing` indicator event
- [ ] Store messages in database (Messages table via Prisma)
- [ ] `GET /api/messages/:userId` — load chat history with a specific user (paginated)
- [ ] Frontend chat sidebar/overlay:
  - [ ] Chat list: friends you've messaged (sorted by most recent)
  - [ ] Message thread: scrollable, auto-scroll to bottom on new message
  - [ ] Message input with send button
  - [ ] Typing indicator ("User is typing...")
  - [ ] Connect Socket.io client to backend for real-time messages

### Frontend — Game Board Start — [Frontend: teammate_1]

- [ ] Create Tic-Tac-Toe board component (`components/GameBoard.tsx`):
  - [ ] 3x3 CSS grid of clickable cells
  - [ ] Each cell displays: empty, "X", or "O"
  - [ ] Click handler: call `onCellClick(cellIndex)`
  - [ ] Visual feedback: hover effect on empty cells, cursor pointer
  - [ ] Current turn indicator: "Your turn (X)" or "Waiting for opponent (O)"

### QA & Testing — [PM: teammate_4]

- [ ] Test profile view and edit flows
- [ ] Test friend request flow end-to-end
- [ ] Test chat between two users (two browser windows)
- [ ] Finalize Privacy Policy and Terms of Service React pages
- [ ] Link Privacy Policy and ToS from footer component

### Modules Progressed

- Module #4 — User Interaction (chat + profiles + friends): **In Progress**
- Module #5 — Standard User Management: **Completed**
- Module #6 — Web-based Game: **Started**

---

## Phase 4: Game Complete + Multiplayer (Day 4)

### Backend — Game Logic — [Backend: teammate_2]

- [ ] Game state model: `{ board: [9 cells], currentTurn: "X"|"O", status, winner }`
- [ ] Move validation function: is it this player's turn? Is the cell empty? Is the game active?
- [ ] Win detection function: check 8 winning lines → return winner or null
- [ ] Draw detection: all 9 cells filled, no winner
- [ ] `POST /api/games` — create new game
- [ ] `POST /api/games/:id/move` — make a move (REST fallback)
- [ ] `GET /api/games/:id` — get current game state
- [ ] Save completed game to database (winner, final board, timestamps)

### Frontend — Game UI Complete — [Frontend: teammate_1]

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

| Team Member | Primary Focus | Key Deliverables |
| :--- | :--- | :--- |
| mgodawat | Infrastructure + Architecture | Docker, HTTPS, code reviews, tech decisions |
| teammate_1 | Frontend UI | React pages, game board, TailwindCSS, customization UI |
| teammate_2 | Backend Logic | Express API, auth, Prisma, AI opponent, tournament |
| teammate_3 | Real-Time Features | Socket.io, multiplayer sync, chat, online status |
| teammate_4 | Project Management + QA | GitHub Issues, testing, Privacy Policy, ToS, README |
