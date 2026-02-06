_This project has been created as part of the 42 curriculum by mgodawat, [teammate_1], [teammate_2], [teammate_3]._

# ft_transcendence — The Ultimate Multiplayer Pong Experience

## Description

ft_transcendence is a web-based multiplayer Pong game that allows users to compete in real-time, track their match history, and interact socially. Built with React, Express, PostgreSQL, and WebSockets, the project demonstrates full-stack web development skills including real-time communication, secure authentication, and AI-driven gameplay.

**Key Features:**

- **Classic Pong Reimagined:** A fast-paced, responsive browser-based Pong game with customizable settings.
- **Real-Time Multiplayer:** Play against friends or opponents online with WebSocket-powered synchronization.
- **AI Opponent:** Challenge a server-side bot that simulates human-like play.
- **Tournament System:** Compete in bracket-style tournaments with matchmaking.
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
    docker compose up --build
    ```

4. Access the application:

    - **Frontend:** https://localhost:4443
    - **Backend API:** https://localhost:3000

5. To stop the application:

    ```bash
    docker compose down
    ```

### Development Setup (for contributors)

If you are joining the team and want to develop locally outside Docker:

1. Install Node.js (v20 LTS recommended).
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

**AI Usage:** AI tools were used to assist in generating initial project boilerplate, drafting documentation structure, brainstorming module strategies, and debugging configuration issues. All AI-generated code was reviewed, understood, and adapted by team members before inclusion.

## Documentation

- [Implementation Plan](doc/implementation_plan.md)
- [Task List](doc/tasks.md)

---

## Team Information

*(Roles assigned as per Subject II.1.1. One person may hold multiple roles in a smaller team.)*

- **mgodawat**
    - **Role(s):** Tech Lead / Fullstack Developer
    - **Responsibilities:** Architecture design, Docker setup, backend API implementation, frontend integration, code quality standards.

- **[teammate_1]**
    - **Role(s):** Frontend Developer / UI Designer
    - **Responsibilities:** React components, TailwindCSS styling, game canvas rendering, responsive design, accessibility.

- **[teammate_2]**
    - **Role(s):** Backend Developer / Game Logic
    - **Responsibilities:** Database schema, Prisma ORM, game physics engine, WebSocket gateway, API endpoints.

- **[teammate_3]**
    - **Role(s):** Product Owner (PO) / Project Manager (PM)
    - **Responsibilities:** Requirement analysis, task tracking, QA testing, final verification, evaluation preparation.

*Note: Until all teammates are onboarded, mgodawat is covering all roles. Roles will be redistributed as team members join.*

## Project Management

- **Organization:** Agile workflow with regular check-ins and iterative sprints.
- **Task Distribution:** Tasks are tracked in [doc/tasks.md](doc/tasks.md) and assigned based on roles. Each task is tagged with the responsible role.
- **Tools:** GitHub Issues / GitHub Projects for issue tracking.
- **Communication:** Discord server for real-time team communication.
- **Onboarding:** New team members should read this README, the [Implementation Plan](doc/implementation_plan.md), and the [Task List](doc/tasks.md) to get up to speed. The project is structured so any developer can pick up unassigned tasks.

## Technical Stack

| Layer | Technology | Justification |
| :--- | :--- | :--- |
| **Frontend** | React (Vite) + TailwindCSS | Component-based architecture ideal for dynamic UIs. Tailwind enables rapid, consistent styling. Vite provides fast hot-reload during development. |
| **Backend** | Express (Node.js) + TypeScript | Lightweight, minimal-boilerplate framework. Easy to learn and extend. TypeScript adds type safety. |
| **Database** | PostgreSQL | Robust relational database for complex relationships (users, games, friends, tournaments). |
| **ORM** | Prisma | Type-safe database access, auto-generated migrations, and excellent TypeScript integration. |
| **Real-Time** | Socket.io (WebSockets) | Enables bidirectional real-time communication for multiplayer gameplay and chat. |
| **Auth** | JWT (JSON Web Tokens) + bcrypt | Stateless authentication with secure password hashing. |
| **DevOps** | Docker + Docker Compose | Single-command deployment. Consistent environments across development and evaluation. |
| **Styling** | TailwindCSS | Utility-first CSS framework for rapid UI development. |

## Database Schema

*(Schema managed via Prisma — see `backend/prisma/schema.prisma` for the source of truth)*

**Core Tables:**

- **Users:** id, email, username, password_hash, avatar_url, display_name, is_online, created_at, updated_at
- **Games:** id, player1_id, player2_id, player1_score, player2_score, winner_id, game_mode (normal/ai/tournament), game_settings (JSON), status (waiting/playing/finished), started_at, finished_at
- **Friends:** id, requester_id, addressee_id, status (pending/accepted/blocked), created_at
- **Messages:** id, sender_id, receiver_id, content, read, created_at
- **Tournaments:** id, name, status (registration/in_progress/completed), created_by, created_at
- **TournamentParticipants:** id, tournament_id, user_id, seed, eliminated, joined_at

**Relationships:**

- Users → Games (one-to-many as player1 or player2)
- Users → Friends (many-to-many through Friends table)
- Users → Messages (one-to-many as sender or receiver)
- Users → Tournaments (many-to-many through TournamentParticipants)
- Tournaments → Games (one-to-many)

## Features List

| Feature | Status | Owner | Description |
| :--- | :--- | :--- | :--- |
| Project Setup & Dockerization | ✅ Done | mgodawat | Docker Compose with frontend, backend, and database containers |
| User Authentication (email/password) | 🔲 Planned | Backend Dev | Signup, login, JWT tokens, password hashing with bcrypt |
| User Profiles (view/edit/avatar) | 🔲 Planned | Fullstack | Profile page, avatar upload, display name editing |
| Friends System | 🔲 Planned | Backend Dev | Add/remove friends, online status, friend requests |
| Real-Time Chat | 🔲 Planned | Fullstack | Direct messages via WebSockets, chat history |
| Pong Game (local) | 🔲 Planned | Game Dev | Canvas-based Pong with game loop, physics, scoring |
| Remote Multiplayer | 🔲 Planned | Fullstack | Online 1v1 via WebSockets with state synchronization |
| AI Opponent | 🔲 Planned | Game Dev | Server-side bot with human-like behavior |
| Tournament System | 🔲 Planned | Backend Dev | Bracket generation, matchmaking, progression |
| Game Customization | 🔲 Planned | Frontend Dev | Paddle colors, ball speed, map themes, default options available |
| Game Statistics & Match History | 🔲 Planned | Fullstack | Wins/losses, rankings, match history display, leaderboard |
| Privacy Policy Page | 🔲 Planned | PM | Accessible from footer, relevant content |
| Terms of Service Page | 🔲 Planned | PM | Accessible from footer, relevant content |
| HTTPS Configuration | 🔲 Planned | Tech Lead | SSL/TLS for all backend communication |

## Modules (18 Points Target — 4-Point Safety Buffer)

The subject requires a minimum of 14 points. We target 18 points to provide a safety margin in case any module is not fully validated during evaluation.

| # | Category | Module | Type | Points | Owner(s) | Implementation Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Web | Use frameworks (React + Express) | Major | 2 | All | React for frontend, Express for backend |
| 2 | Web | Database ORM (Prisma) | Minor | 1 | Backend Dev | Type-safe queries, auto migrations |
| 3 | Web | Real-time WebSockets (Socket.io) | Major | 2 | Fullstack | Game sync, chat, live notifications |
| 4 | Web | User interaction (chat + profiles + friends) | Major | 2 | Fullstack | Chat system, profile pages, friends list |
| 5 | User Mgmt | Standard user management | Major | 2 | Fullstack | Auth, avatars, profiles, online status |
| 6 | Gaming | Web-based Pong game | Major | 2 | Game Dev | Canvas 2D game with physics and scoring |
| 7 | Gaming | Remote players (online 1v1) | Major | 2 | Fullstack | WebSocket state sync, reconnection logic |
| 8 | Gaming | Tournament system | Minor | 1 | Backend Dev | Bracket system, matchmaking, registration |
| 9 | AI | AI Opponent | Major | 2 | Game Dev | Paddle-tracking heuristic with human-like imperfection |
| 10 | Gaming | Game customization | Minor | 1 | Frontend Dev | Paddle colors, ball speed, map themes |
| 11 | User Mgmt | Game statistics & match history | Minor | 1 | Fullstack | Win/loss tracking, leaderboard, match history page |
| | | | **Total** | **18** | | |

**Point Breakdown:** 7 Major modules (14 pts) + 4 Minor modules (4 pts) = **18 points**

**Core modules (14 pts):** #1–#8 — these must be completed and are the priority.

**Bonus modules (4 pts):** #9–#11 — low-effort additions built on top of existing infrastructure. These are implemented last and can be dropped if time runs short without falling below 14 points.

**Module Dependencies (per subject requirements):**

- Modules #7, #8, #9, #10, #11 all require Module #6 (web-based game) to be implemented first.
- Module #11 (Game Statistics) requires at least one game to be functional.
- Module #4 (User interaction) requires basic user authentication from Module #5.

## Individual Contributions

*(This section will be updated throughout development. Each team member must be able to explain their contributions during evaluation.)*

- **mgodawat:** Initialized project structure, set up Docker environment, created documentation and implementation plan, architected the tech stack. Currently covering all development roles until teammates join.

- **[teammate_1]:** *(To be updated — Frontend components, TailwindCSS theme, UI mockups, game canvas rendering)*

- **[teammate_2]:** *(To be updated — Database schema, Express API routes, WebSocket gateway, game physics)*

- **[teammate_3]:** *(To be updated — Project requirements, GitHub Issues management, QA testing, evaluation preparation)*

---

*Last updated: February 2025*
