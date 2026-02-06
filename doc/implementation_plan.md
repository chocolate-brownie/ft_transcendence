# Implementation Plan — ft_transcendence

## Goal: Multiplayer Pong with Social Features (18 Points Target)

This plan outlines the strategy to build a robust multiplayer Pong application, adhering to the 42 subject requirements and securing 18 evaluation points (14 core + 4 safety buffer).

---

## Team Roles (Ref: Subject II.1.1)

| Role | Assigned To | Responsibilities |
| :--- | :--- | :--- |
| **Product Owner (PO)** | [teammate_3] | Feature scope, module prioritization, final delivery verification |
| **Project Manager (PM)** | [teammate_3] | Progress tracking, task management, risk management |
| **Tech Lead / Architect** | mgodawat | Docker, repo structure, tech stack decisions, code reviews |
| **Backend Developer** | [teammate_2] | Express API, auth, database, WebSocket gateway |
| **Frontend Developer** | [teammate_1] | React components, TailwindCSS, game canvas, responsive design |
| **Game Developer** | Shared | Game loop, physics, AI opponent, multiplayer sync |

*Note: mgodawat is currently covering all roles solo. When teammates join, tasks should be redistributed based on the role assignments above. All unstarted tasks in [tasks.md](tasks.md) are available for pickup.*

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                        │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Frontend    │  │   Backend    │  │  PostgreSQL   │  │
│  │   (React +   │  │  (Express +  │  │  (Database)   │  │
│  │    Vite)     │──▶│  Socket.io)  │──▶│              │  │
│  │  Port: 5173  │  │  Port: 3000  │  │  Port: 5432  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         │                  │                             │
│         └──── WebSocket ───┘                             │
│              (real-time)                                  │
└─────────────────────────────────────────────────────────┘
```

**Tech Stack:**

| Layer | Technology | Why |
| :--- | :--- | :--- |
| Frontend | React (Vite) + TailwindCSS | Component-based, fast dev server, huge ecosystem |
| Backend | Express + TypeScript | Minimal boilerplate, beginner-friendly, flexible |
| Database | PostgreSQL + Prisma ORM | Relational integrity, type-safe queries |
| Real-Time | Socket.io | Bidirectional WebSocket communication |
| Auth | JWT + bcrypt | Stateless sessions, secure password hashing |
| DevOps | Docker + Docker Compose | Single-command deployment |

---

## Module Strategy (18 Points)

### Core Modules (14 Points — MUST complete)

| # | Module | Pts | Priority | Dependencies |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Web frameworks (React + Express) | 2 | Day 1 | None |
| 2 | Prisma ORM | 1 | Day 1 | None |
| 3 | Real-time WebSockets | 2 | Day 4-5 | #1 |
| 4 | User interaction (chat + profiles + friends) | 2 | Day 3 | #1, #5 |
| 5 | Standard user management | 2 | Day 2 | #1, #2 |
| 6 | Web-based Pong game | 2 | Day 4 | #1 |
| 7 | Remote players | 2 | Day 5 | #3, #6 |
| 8 | Tournament system | 1 | Day 5-6 | #6 |

### Bonus Modules (4 Points — implement after core is stable)

| # | Module | Pts | Priority | Dependencies |
| :--- | :--- | :--- | :--- | :--- |
| 9 | AI Opponent | 2 | Day 6 | #6 |
| 10 | Game customization | 1 | Day 6 | #6 |
| 11 | Game statistics & match history | 1 | Day 6 | #5, #6 |

### Drop Strategy

If running out of time, drop in reverse order: #11 → #10 → #9 → #8. This keeps you at 14 points minimum.

---

## 7-Day Development Timeline

### Day 1 — Foundation

**Goal:** Docker runs, frontend and backend respond, database connects.

- Install Docker, Node.js, Git (if needed)
- Create project directory structure
- Write Dockerfiles for frontend and backend
- Write docker-compose.yml (frontend + backend + PostgreSQL)
- Initialize React app (Vite + TailwindCSS)
- Initialize Express app (TypeScript + basic route)
- Initialize Prisma with PostgreSQL connection
- Create initial database schema (Users table)
- Verify: `docker compose up --build` → see React page + Express API responding

**Modules progressed:** #1 (Web frameworks), #2 (ORM)

### Day 2 — User Authentication & Management

**Goal:** Users can sign up, log in, and have JWT-protected sessions.

- Implement Prisma schema for Users (email, username, password_hash, avatar_url, etc.)
- Create Express auth routes: POST /api/auth/signup, POST /api/auth/login
- Implement password hashing with bcrypt
- Implement JWT token generation and middleware
- Create React pages: Login form, Signup form
- Connect frontend auth to backend API
- Input validation on both frontend and backend
- Verify: Can sign up a new user, log in, and access a protected route

**Modules progressed:** #5 (Standard user management)

### Day 3 — Profiles, Friends & Chat

**Goal:** Social features are functional. Users can view profiles, manage friends, and chat.

- Implement user profile API (GET/PUT /api/users/:id)
- Avatar upload endpoint (with default avatar fallback)
- Friends system API (send request, accept, remove, list friends)
- Online status tracking (updated via WebSocket connection)
- Basic chat system with Socket.io (send/receive direct messages)
- React pages: Profile page (view/edit), Friends list, Chat sidebar
- Store messages in database (Messages table)
- Verify: Two users can add each other as friends and exchange chat messages

**Modules progressed:** #4 (User interaction), #5 (Standard user management — completed)

### Day 4 — Pong Game (Local)

**Goal:** Playable local Pong game in the browser.

- HTML5 Canvas game rendering (ball, paddles, score)
- Game loop (requestAnimationFrame at 60fps)
- Physics: ball movement, wall bouncing, paddle collision
- Keyboard input handling (W/S and Up/Down arrows)
- Scoring system and win condition
- Game over screen with restart option
- React component wrapping the canvas
- Verify: Two players on the same keyboard can play a full game of Pong

**Modules progressed:** #6 (Web-based game)

### Day 5 — Multiplayer & Real-Time

**Goal:** Two players on different computers can play Pong together.

- Server-side game state management (Express + Socket.io)
- Matchmaking queue (find opponent or create room)
- WebSocket events: game state sync, player input relay
- Client-side prediction for smooth gameplay
- Handle disconnection and reconnection gracefully
- Room management (create, join, leave, spectate)
- Save match results to database (Games table)
- Verify: Open two browser tabs/windows → match found → play a full remote game

**Modules progressed:** #3 (Real-time WebSockets), #7 (Remote players)

### Day 6 — Bonus Modules & Tournament

**Goal:** Tournament system works. AI opponent is playable. Game has customization and stats.

- Tournament system:
    - Create tournament, register players
    - Auto-generate bracket (power of 2 seeding)
    - Progress through rounds, determine winner
    - React pages: Tournament list, bracket view, registration
- AI Opponent:
    - Server-side bot that tracks ball Y position
    - Add reaction delay and random offset for human-like imperfection
    - Difficulty settings (easy/medium/hard = more/less offset)
- Game Customization:
    - Settings menu before game: paddle color, ball speed, map theme
    - Store preferences, apply during gameplay
    - Default options always available
- Game Statistics:
    - Match history page (opponent, score, date, result)
    - User stats (wins, losses, win rate, ranking)
    - Leaderboard page (top players by wins)
- Verify: Can play in a tournament, beat/lose to AI, customize game, see stats

**Modules progressed:** #8 (Tournament), #9 (AI Opponent), #10 (Customization), #11 (Statistics)

### Day 7 — Mandatory Checks, Polish & Submission

**Goal:** Project passes all subject mandatory requirements. Ready for evaluation.

- Privacy Policy page (accessible from footer, relevant content)
- Terms of Service page (accessible from footer, relevant content)
- HTTPS configuration (self-signed certificate for development)
- Check: zero warnings or errors in browser console
- Check: responsive design works on different screen sizes
- Check: all forms have frontend AND backend validation
- Check: .env is gitignored, .env.example is committed
- Full Docker test: `docker compose down && docker compose up --build` from scratch
- Update README.md with final details (contributions, module justifications)
- Final manual testing of all features as an evaluator would
- Prepare for evaluation: each team member should be able to explain their part

**Nothing new built — this day is purely for hardening and verification.**

---

## Mandatory Subject Requirements Checklist

These are non-negotiable. Failing any of these = project rejection.

- [ ] Web application with frontend, backend, and database
- [ ] Git with clear commits from all team members
- [ ] Single-command deployment via Docker Compose
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

If you are joining the team mid-project:

1. **Read** this document and the [README.md](../README.md) first.
2. **Check** [tasks.md](tasks.md) for unassigned or in-progress tasks.
3. **Setup** your local environment:
    - Clone the repo
    - Copy `.env.example` to `.env`
    - Run `docker compose up --build`
    - Verify you can see the frontend and backend running
4. **Pick a role** from the Team Roles table above and update the README.
5. **Pick tasks** from [tasks.md](tasks.md) that match your role.
6. **Create a branch** for your feature: `git checkout -b feature/your-feature-name`
7. **Communicate** on Discord before starting any major work.

---

## Verification Plan

### Automated Checks

- `npm run lint` — Code quality (ESLint + Prettier)
- `npm run test` — Backend unit tests (if time allows)
- `docker compose up --build` — Full integration test

### Manual Verification (Day 7)

- [ ] Fresh `docker compose up --build` works on a clean machine
- [ ] Chrome: no console errors or warnings
- [ ] Sign up → Log in → Edit profile → Upload avatar
- [ ] Add friend → Send chat message → See online status
- [ ] Play local Pong → Play remote Pong → Play vs AI
- [ ] Create tournament → Play through bracket → See winner
- [ ] Customize game → Settings applied in gameplay
- [ ] View match history → View leaderboard
- [ ] Privacy Policy and ToS pages accessible and have content
- [ ] HTTPS working on all endpoints
