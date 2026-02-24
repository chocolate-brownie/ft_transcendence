# Project Requirements Document (PRD)

## 1. Project Overview

**ft_transcendence** is a web-based gaming portal built around Tic-Tac-Toe, designed to showcase real-time multiplayer interactions, social features, and competitive play. It combines a modern React front end, a TypeScript/Express back end, and Socket.io for live updates, all containerized with Docker for consistent deployment. Users can sign up, add friends, chat, and play Tic-Tac-Toe in remote matches, local hot-seat mode, or against an AI powered by the Minimax algorithm.

This platform exists to teach and demonstrate core full-stack skills: secure authentication, database persistence with Prisma and PostgreSQL, real-time communication via WebSockets, and scalable deployment using Docker Compose. Success is measured by stable, low-latency matches, seamless social interactions, a functioning tournament bracket and leaderboard, and a clean codebase maintained to TypeScript and ESLint/Prettier standards.

---

## 2. In-Scope vs. Out-of-Scope

### In-Scope (Version 1.0)
- Secure user registration, login, and JWT-based authentication.  
- Real-time multiplayer Tic-Tac-Toe: remote matches via Socket.io rooms.  
- Single-player mode with an adjustable-difficulty Minimax AI.  
- Local hot-seat mode for two players on one device.  
- Friend system: send/accept requests, view online/offline/in-game status.  
- In-game chat with typing indicators and message history.  
- Tournament bracket creation and progression tracking.  
- Global leaderboard and per-user statistics (wins, losses, draws).  
- User profiles: avatar upload, display name, match history.  
- Persistent storage using Prisma ORM and PostgreSQL.  
- Docker Compose setup and Makefile for one-command local development.  

### Out-of-Scope (Later Phases)
- Voice or video chat.  
- Third-party login (OAuth) or social media integration.  
- Mobile-first native apps (React Native, SwiftUI, etc.).  
- In-app purchases, ads, or virtual currencies.  
- Custom game themes beyond basic color palettes.  
- Advanced analytics dashboard or A/B testing.  
- Multi-game support beyond Tic-Tac-Toe.  

---

## 3. User Flow

A new visitor arrives at the landing page and sees options to log in or sign up. After supplying an email/username and password, they receive a JWT token and land on their personal dashboard. The left sidebar lists navigation items—Play Online, Play vs AI, Local Match, Friends, Tournaments, Leaderboard, Profile—while the main area highlights pending friend requests, open tournaments, and quick-start buttons.

When the user selects Play Online, they join a matchmaking queue; once paired, a Socket.io room initializes the board on both clients. Moves emit through WebSockets, the server validates them against game rules, updates the database, and broadcasts the new board state. Users can chat in a sidebar panel. After the game ends, win/loss/draw results update the user’s stats and leaderboard position. At any time, users can navigate to Friends to manage connections or to Tournaments for bracket play.

---

## 4. Core Features

- **Authentication & Security**: Email/password sign-up, JWT tokens, bcrypt hashing, protected REST endpoints, and authenticated WebSocket handshakes.  
- **Multi-Mode Gameplay**: Remote multiplayer, local two-player, and AI challenge with adjustable difficulty.  
- **Real-Time Communication**: Server-client sync via Socket.io, room management, move validation, and state broadcasts.  
- **Social Interaction**: Friend requests, real-time online status, direct chat with history and typing indicators.  
- **Competitive Play**: Bracket-style tournament creation/joining, match scheduling, and progression.  
- **Leaderboard & Stats**: Global ranking by win rate, detailed per-user stats, match history.  
- **User Profiles**: Avatar upload, name customization, profile editing.  
- **Persistence**: Prisma ORM with PostgreSQL for users, games, messages, and tournaments.  
- **Containerization**: Docker Compose and Makefile for unified local setup.  

---

## 5. Tech Stack & Tools

**Frontend**  
- Framework: React (Vite) with TypeScript  
- Styling: TailwindCSS  
- State: React Context API for auth and global state  
- Real-Time Lib: Socket.io Client  
- Linting & Formatting: ESLint, Prettier  

**Backend**  
- Runtime & Framework: Node.js, Express.js with TypeScript  
- ORM: Prisma Client (TypeScript-generated)  
- Database: PostgreSQL  
- WebSockets: Socket.io Server  
- Auth: JSON Web Tokens (JWT), bcrypt password hashing  

**Infrastructure**  
- Containerization: Docker, Docker Compose  
- Scripts & Automation: Makefile  
- Dev Environment: VS Code, optional Windsurf/Cursor AI plugins  

---

## 6. Non-Functional Requirements

- **Performance**:     
  - Web UI initial load under 2 seconds in normal network conditions.  
  - WebSocket round-trip latency under 150 ms for move broadcasts.  
  - Support at least 100 concurrent active WebSocket connections per server.  
- **Security & Compliance**:     
  - All passwords hashed with bcrypt; JWT tokens signed by 256-bit secret.  
  - Enforce CORS, rate limiting on auth routes, and HTTPS in production.  
  - GDPR-compatible storage and data deletion on user request.  
- **Reliability**:     
  - Automatic reconnection and state recovery (Socket.io connectionStateRecovery).  
  - Graceful handling of dropped connections and unfinished games.  
- **Maintainability**:     
  - 90%+ code coverage on critical game logic and auth modules.  
  - Pre-commit hooks for linting and formatting.  
- **Usability**:     
  - Responsive design for desktop and tablet.  
  - Clear error messaging on form validation and network failures.  

---

## 7. Constraints & Assumptions

- **Docker Required**: The local and staging environments rely on Docker Compose.  
- **Modern Browser**: Users must run recent Chrome, Firefox, or Safari with WebSocket support.  
- **Resource Limits**: Single Node.js process per container; plan horizontal scaling later.  
- **Third-Party Dependencies**: Stable access to npm registry and Postgres image repository.  
- **AI Opponent**: Minimax logic runs server-side in Node; no external AI services.  

---

## 8. Known Issues & Potential Pitfalls

- **WebSocket Scaling**: A single server can handle limited connections—consider Redis adapter for multi-instance pub/sub when scaling.  
- **Race Conditions**: Concurrent move events could lead to invalid states; ensure server-side move validation and atomic DB updates (Prisma transactions).  
- **Reconnection Gaps**: Users dropping mid-game might lose state; use Socket.io’s connectionStateRecovery and store ephemeral rooms in Redis if needed.  
- **Database Performance**: High write volume on game end could cause locks—batch leaderboard updates or use read replicas in the future.  
- **Security**: JWT expiration and refresh logic must be clearly defined to avoid stale tokens.  
- **CORS & Auth**: Misconfigured CORS or missing handshake middleware can block WebSocket connections; test with production-like hostnames.  

**Mitigation Tips**  
- Introduce Redis from day two if you foresee more than 200 concurrent users.  
- Validate and serialize WebSocket events with middleware to prevent malformed payloads.  
- Use Prisma’s transactional API around game result updates to guarantee data integrity.  
- Automate token rotation and session invalidation on logout to reduce security risk.  

---

This PRD captures all essential functional and non-functional requirements, boundary definitions, and clear user journeys. It equips an AI or development team to generate detailed technical designs—Tech Stack Document, Frontend Guidelines, Backend Architecture, File Structure, and Deployment Playbook—without ambiguity.