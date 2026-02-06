_This project has been created as part of the 42 curriculum by mgodawat, [teammate_1], [teammate_2], [teammate_3]._

# ft_transcendence - The Ultimate Multiplayer Pong Experience

## Description
ft_transcendence is a web-based multiplayer Pong game that allows users to compete in real-time, track their history, and interact socially. The project demonstrates advanced web development skills, including full-stack framework integration, real-time communication via WebSockets, and database management.

**Key Features:**
*   **Classic Pong:** A fast-paced, responsive reimagining of the classic arcade game.
*   **Multiplayer:** Play against friends or random opponents online.
*   **Social Hub:** User profiles, friends lists, and real-time chat.
*   **Security:** JWT authentication and secure password handling.
*   **AI Opponent:** A challenging single-player mode.

## Instructions

### Prerequisites
*   Docker & Docker Compose
*   Node.js (for local development outside Docker)

### Installation & Execution
1.  Clone the repository:
    ```bash
    git clone https://github.com/your-repo/ft_transcendence.git
    cd ft_transcendence
    ```
2.  Setup Environment Variables:
    ```bash
    cp .env.example .env
    # Edit .env with your specific configuration if needed
    ```
3.  Run the application using Docker Compose:
    ```bash
    docker-compose up --build
    ```
4.  Access the application:
    *   **Frontend:** http://localhost:5173 (or port 80 depending on configuration)
    *   **Backend API:** http://localhost:3000

## Resources
*   [NestJS Documentation](https://docs.nestjs.com/)
*   [React Documentation](https://react.dev/)
*   [Socket.io Documentation](https://socket.io/docs/v4/)
*   [Prisma Documentation](https://www.prisma.io/docs)
*   [TailwindCSS Documentation](https://tailwindcss.com/docs)
*   **AI Usage**: AI tools were used to assist in generating initial project boilerplate, drafting documentation structure, and brainstorming module strategies. Specifically, for generating the Docker configuration and initial NestJS/React setups.

## Documentation
*   [Implementation Plan](doc/implementation_plan.md)
*   [Task List](doc/tasks.md)

---

## Team Information
*(Roles assigned as per Subject II.1.1)*

*   **mgodawat**
    *   **Role**: Tech Lead / Fullstack Developer
    *   **Responsibilities**: Architecture design, Docker setup, CI/CD, Backend API implementation, Frontend integration.

*   **[teammate_1]**
    *   **Role**: Frontend Developer / UI Designer
    *   **Responsibilities**: React components, Tailwind styling, Game Canvas rendering, Responsive design.

*   **[teammate_2]**
    *   **Role**: Backend Developer / Game Logic
    *   **Responsibilities**: PostgreSQL schema, Prisma ORM, Game Physics engine, WebSocket gateway.

*   **[teammate_3]**
    *   **Role**: Product Owner (PO) / Project Manager (PM)
    *   **Responsibilities**: Requirement analysis, Task tracking (Jira/GitHub), QA Testing, Final verification.

## Project Management
*   **Organization**: We follow an Agile workflow with daily standups and weekly sprints.
*   **Task Distribution**: Tasks are tracked in `doc/tasks.md` and assigned based on roles.
*   **Tools**: GitHub Projects for issue tracking.
*   **Communication**: Discord server for real-time communication.

## Technical Stack
*   **Frontend**: React (Vite) + TailwindCSS
    *   *Why?* React offers a component-based architecture perfect for dynamic UIs. Tailwind ensures rapid, consistent styling.
*   **Backend**: NestJS (Node.js)
    *   *Why?* Proven modular architecture, TypeScript support, and easy integration with Socket.io.
*   **Database**: PostgreSQL
    *   *Why?* Robust relational database for handling complex relationships (Users, Games, Friends).
*   **ORM**: Prisma
    *   *Why?* Type-safe database access and easy migration management.

## Database Schema
*(Preliminary Schema Strategy)*
*   **Users Table**: Stores user profile, credentials (hashed), stats.
*   **Games Table**: Stores match history, scores, player IDs.
*   **Friends Table**: Manages follow/friend relationships.

## Features List
*(Currently in Planning Phase)*
*   [x] Project Setup & Dockerization (mgodawat)
*   [ ] User Authentication (Planned)
*   [ ] User Profiles (Planned)
*   [ ] Pong Game Loop (Planned)
*   [ ] Real-time Multiplayer (Planned)
*   [ ] Chat System (Planned)

## Modules (14 Points Target)
*   **Web Frameworks (Major - 2pts)**: React & NestJS.
*   **Web Database ORM (Minor - 1pt)**: Prisma.
*   **User Management (Major - 2pts)**: Auth, Profiles, Statistics.
*   **User Mgmt Remote Auth (Minor - 1pt)**: OAuth Integration.
*   **Gaming Web Game (Major - 2pts)**: Classic Pong.
*   **Gaming Remote Players (Major - 2pts)**: Online 1v1.
*   **Gaming Customization (Minor - 1pt)**: Paddle skins/colors.
*   **Gaming Tournament (Minor - 1pt)**: Bracket system.
*   **AI Opponent (Major - 2pts)**: Server-side bot.

## Individual Contributions
*   **mgodawat**: Initialized project structure, set up Docker environment, created documentation plan.
*   **[teammate_1]**: (Placeholder) Implemented Frontend components, configured Tailwind Theme, designed UI Mockups.
*   **[teammate_2]**: (Placeholder) Designed Database Schema, implemented NestJS Auth Module, set up WebSocket Gateway.
*   **[teammate_3]**: (Placeholder) Defined Project Requirements, managed GitHub Issues, performed QA testing on Release 1.0.
