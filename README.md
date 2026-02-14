_This project has been created as part of the 42 curriculum by mgodawat, [teammate_1], [teammate_2], [teammate_3], [teammate_4]._

# ft_transcendence — The Ultimate Multiplayer Tic-Tac-Toe Experience

## Description

ft_transcendence is a web-based multiplayer Tic-Tac-Toe platform that allows users to compete in real-time, track their match history, and interact socially. Built with React, Express, PostgreSQL, and WebSockets, the project demonstrates full-stack web development skills including real-time communication, secure authentication, and AI-driven gameplay.

**Key Features:**

- **Classic Tic-Tac-Toe Reimagined:** A polished, responsive browser-based Tic-Tac-Toe game with customizable themes and symbols.
- **Real-Time Multiplayer:** Play against friends or opponents online with WebSocket-powered turn synchronization.
- **AI Opponent:** Challenge a server-side bot powered by the Minimax algorithm with adjustable difficulty.
- **Tournament System:** Compete in bracket-style tournaments with matchmaking and progression.
- **Social Hub:** User profiles, friends lists, online status, and real-time chat.
- **Statistics & History:** Track your wins, losses, ranking, and full match history.
- **Secure Authentication:** Email/password login with hashed credentials and JWT sessions.

## Instructions

### Prerequisites

- **Docker** & **Docker Compose** (v2+)
- **Git**
- A modern web browser (Google Chrome latest stable — required for evaluation)

### Installation & Execution

1. Clone the repository:

   ```bash
   git clone https://github.com/your-repo/ft_transcendence.git
   cd ft_transcendence
   ```

2. Set up environment variables:

   ```bash
   cp .env.example .env
   # Edit .env with your specific configuration if needed
   ```

3. Run the application (single command as required by the subject):

   ```bash
   make
   ```

4. Access the application:
   - **Frontend:** https://localhost:5173
   - **Backend API:** https://localhost:3000

5. To stop the application:

   ```bash
   make down
   ```

6. To fully clean (remove containers, volumes, images):

   ```bash
   make fclean
   ```

### Development Setup (for contributors)

If you are joining the team and want to develop locally outside Docker:

1. Install Node.js (v22 LTS recommended).
2. Backend:

   ```bash
   cd backend && npm install && npm run dev
   ```

3. Frontend:

   ```bash
   cd frontend && npm install && npm run dev
   ```

4. Database: Ensure PostgreSQL is running locally or use the Docker container:

   ```bash
   docker compose up db
   ```

## Resources

- [Express Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Docker Documentation](https://docs.docker.com/)
- [JWT Introduction](https://jwt.io/introduction)
- [Minimax Algorithm Explained](https://en.wikipedia.org/wiki/Minimax)

**AI Usage:** AI tools were used to assist in generating initial project boilerplate, drafting documentation structure, brainstorming module strategies, and debugging Docker configuration issues. All AI-generated code was reviewed, understood, and adapted by team members before inclusion.

## Documentation

- [Implementation Plan](doc/implementation_plan.md)
- [Task List](doc/tasks.md)

---

## Team Information

_(Roles assigned as per Subject II.1.1. With 5 team members, roles are specialized as recommended by the subject.)_

- **mgodawat**
  - **Role(s):** Tech Lead / Architect
  - **Responsibilities:** Architecture design, Docker setup, tech stack decisions, code reviews, HTTPS configuration, code quality standards.

- **[teammate_1]**
  - **Role(s):** Frontend Developer / UI Designer
  - **Responsibilities:** React components, TailwindCSS styling, game board rendering, responsive design, page layouts.

- **[teammate_2]**
  - **Role(s):** Backend Developer
  - **Responsibilities:** Express API routes, Prisma ORM queries, database schema, authentication endpoints, game logic API.

- **[teammate_3]**
  - **Role(s):** Fullstack Developer / Real-Time Specialist
  - **Responsibilities:** WebSocket gateway (Socket.io), multiplayer game synchronization, chat system, real-time features.

- **[teammate_4]**
  - **Role(s):** Product Owner (PO) / Project Manager (PM)
  - **Responsibilities:** Requirement analysis, task tracking, QA testing, evaluation preparation, README finalization, Privacy Policy and ToS pages.

## Project Management

- **Organization:** Agile workflow with regular check-ins and iterative sprints.
- **Task Distribution:** Tasks are tracked in [doc/tasks.md](doc/tasks.md) and assigned based on roles. Each task is tagged with the responsible role.
- **Tools:** GitHub Issues / GitHub Projects for issue tracking.
- **Communication:** Discord server for real-time team communication.
- **Onboarding:** New team members should read this README, the [Implementation Plan](doc/implementation_plan.md), and the [Task List](doc/tasks.md) to get up to speed. The project is structured so any developer can pick up unassigned tasks.

## Technical Stack

| Layer         | Technology                     | Justification                                                                                                                                     |
| :------------ | :----------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Frontend**  | React (Vite) + TailwindCSS     | Component-based architecture ideal for dynamic UIs. Tailwind enables rapid, consistent styling. Vite provides fast hot-reload during development. |
| **Backend**   | Express (Node.js) + TypeScript | Lightweight, minimal-boilerplate framework. Easy to learn and extend. TypeScript adds type safety.                                                |
| **Database**  | PostgreSQL                     | Robust relational database for complex relationships (users, games, friends, tournaments).                                                        |
| **ORM**       | Prisma                         | Type-safe database access, auto-generated migrations, and excellent TypeScript integration.                                                       |
| **Real-Time** | Socket.io (WebSockets)         | Enables bidirectional real-time communication for multiplayer gameplay and chat.                                                                  |
| **Auth**      | JWT (JSON Web Tokens) + bcrypt | Stateless authentication with secure password hashing.                                                                                            |
| **DevOps**    | Docker + Docker Compose        | Single-command deployment. Consistent environments across development and evaluation.                                                             |
| **Styling**   | TailwindCSS                    | Utility-first CSS framework for rapid UI development.                                                                                             |

## Database Schema

_(Schema managed via Prisma — see `backend/prisma/schema.prisma` for the source of truth)_

**Core Tables:**

- **Users:** id, email, username, password_hash, avatar_url, is_online, wins, losses, created_at, updated_at
- **Games:** id, player1_id, player2_id, winner_id, board_state (JSON — array of 9 cells), current_turn, game_type (classic/custom/tournament), status (waiting/in_progress/finished/draw), settings (JSON), created_at, finished_at
- **Friends:** id, requester_id, addressee_id, status (pending/accepted/blocked), created_at
- **Messages:** id, sender_id, receiver_id, content, created_at
- **Tournaments:** id, name, status (registering/in_progress/finished/cancelled), max_players, created_at, started_at, finished_at
- **TournamentParticipants:** id, tournament_id, user_id, seed, eliminated_at, joined_at

**Relationships:**

- Users → Games (one-to-many as player1 or player2)
- Users → Friends (many-to-many through Friends table)
- Users → Messages (one-to-many as sender or receiver)
- Users → Tournaments (many-to-many through TournamentParticipants)
- Tournaments → Games (one-to-many)

## Features List

| Feature                              | Status     | Owner(s)        | Description                                                      |
| :----------------------------------- | :--------- | :-------------- | :--------------------------------------------------------------- |
| Project Setup & Dockerization        | ✅ Done    | mgodawat        | Docker Compose with frontend, backend, and database containers   |
| User Authentication (email/password) | 🔲 Planned | teammate_2      | Signup, login, JWT tokens, password hashing with bcrypt          |
| User Profiles (view/edit/avatar)     | 🔲 Planned | teammate_1, teammate_2 | Profile page, avatar upload, display name editing         |
| Friends System                       | 🔲 Planned | teammate_2, teammate_3 | Add/remove friends, online status, friend requests        |
| Real-Time Chat                       | 🔲 Planned | teammate_3      | Direct messages via WebSockets, chat history                     |
| Tic-Tac-Toe Game (local)            | 🔲 Planned | teammate_1, teammate_3 | React component grid, game logic, win detection           |
| Remote Multiplayer                   | 🔲 Planned | teammate_3      | Online 1v1 via WebSockets with turn synchronization              |
| AI Opponent                          | 🔲 Planned | teammate_2      | Minimax algorithm with adjustable difficulty                     |
| Tournament System                    | 🔲 Planned | teammate_2, teammate_4 | Bracket generation, matchmaking, progression              |
| Game Customization                   | 🔲 Planned | teammate_1      | Board themes, X/O symbols, grid size variants                    |
| Game Statistics & Match History      | 🔲 Planned | teammate_1, teammate_2 | Wins/losses, rankings, match history, leaderboard         |
| Privacy Policy Page                  | 🔲 Planned | teammate_4      | Accessible from footer, relevant content                         |
| Terms of Service Page                | 🔲 Planned | teammate_4      | Accessible from footer, relevant content                         |
| HTTPS Configuration                  | 🔲 Planned | mgodawat        | SSL/TLS for all backend communication                            |

## Modules (18 Points Target — 4-Point Safety Buffer)

The subject requires a minimum of 14 points. We target 18 points to provide a safety margin in case any module is not fully validated during evaluation.

| #   | Category  | Module                                       | Type      | Points | Owner(s)              | Implementation Notes                                    |
| :-- | :-------- | :------------------------------------------- | :-------- | :----- | :-------------------- | :------------------------------------------------------ |
| 1   | Web       | Use frameworks (React + Express)             | Major     | 2      | All                   | React for frontend, Express for backend                 |
| 2   | Web       | Database ORM (Prisma)                        | Minor     | 1      | teammate_2            | Type-safe queries, auto migrations                      |
| 3   | Web       | Real-time WebSockets (Socket.io)             | Major     | 2      | teammate_3            | Game sync, chat, live notifications                     |
| 4   | Web       | User interaction (chat + profiles + friends) | Major     | 2      | teammate_1, teammate_3 | Chat system, profile pages, friends list                |
| 5   | User Mgmt | Standard user management                     | Major     | 2      | mgodawat, teammate_2  | Auth, avatars, profiles, online status                  |
| 6   | Gaming    | Web-based Tic-Tac-Toe game                   | Major     | 2      | teammate_1, teammate_3 | React component grid with game logic and win detection  |
| 7   | Gaming    | Remote players (online 1v1)                  | Major     | 2      | teammate_3            | WebSocket turn sync, reconnection logic                 |
| 8   | Gaming    | Tournament system                            | Minor     | 1      | teammate_2, teammate_4 | Bracket system, matchmaking, registration               |
| 9   | AI        | AI Opponent                                  | Major     | 2      | teammate_2            | Minimax algorithm with human-like imperfection          |
| 10  | Gaming    | Game customization                           | Minor     | 1      | teammate_1            | Board themes, custom symbols, grid size options          |
| 11  | User Mgmt | Game statistics & match history              | Minor     | 1      | teammate_1, teammate_2 | Win/loss tracking, leaderboard, match history page      |
|     |           |                                              | **Total** | **18** |                       |                                                         |

**Point Breakdown:** 7 Major modules (14 pts) + 4 Minor modules (4 pts) = **18 points**

**Core modules (14 pts):** #1–#8 — these must be completed and are the priority.

**Bonus modules (4 pts):** #9–#11 — built on top of existing infrastructure. These are implemented last and can be dropped if time runs short without falling below 14 points.

**Drop Strategy:** If running short on time, drop in reverse order: #11 → #10 → #9 → #8. This keeps you at 14 points minimum.

**Module Dependencies (per subject requirements):**

- Modules #7, #8, #9, #10, #11 all require Module #6 (web-based game) to be implemented first.
- Module #11 (Game Statistics) requires at least one game to be functional.
- Module #4 (User interaction) requires basic user authentication from Module #5.

## Individual Contributions

_(This section will be updated throughout development. Each team member must be able to explain their contributions during evaluation.)_

- **mgodawat:** Initialized project structure, set up Docker environment, created documentation and implementation plan, architected the tech stack, HTTPS configuration.

- **[teammate_1]:** _(To be updated — React page components, TailwindCSS theme, game board UI, profile pages, customization UI, statistics display)_

- **[teammate_2]:** _(To be updated — Prisma schema, Express API routes, auth system, AI opponent logic, tournament backend, game statistics API)_

- **[teammate_3]:** _(To be updated — Socket.io gateway, multiplayer game sync, chat system, real-time notifications, friends online status)_

- **[teammate_4]:** _(To be updated — Requirements documentation, GitHub Issues, QA testing, Privacy Policy, Terms of Service, evaluation preparation)_

---

_Last updated: February 2025_
