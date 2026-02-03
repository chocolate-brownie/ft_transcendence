# Project To-Do List: ft_transcendence

This document outlines the development roadmap for the ft_transcendence project. We will tackle the project in phases, focusing on building a solid foundation before moving on to more advanced features. Each item is a concrete step towards completing the mandatory requirements and accumulating points for the final grade.

---

## Phase 1: Authentication & User Management (The Foundation)

**Goal:** Allow users to create an account, log in, and log out. Secure the application using modern authentication standards. This phase is critical as almost all other features depend on it.

### 💾 Backend (NestJS)

-   [ ] **Database Schema:**
    -   [ ] Design the `User` table schema. It should include fields like `id` (primary key), `username` (unique), `email` (unique), `password_hash`, `avatar_url`, and `display_name`.
-   [ ] **User Module:**
    -   [ ] Create a `UserModule`.
    -   [ ] Create a `User` entity/model that maps to the database table.
    -   [ ] Create a `UserService` to handle business logic (e.g., creating a user, finding a user by username or ID).
-   [ ] **Authentication Module:**
    -   [ ] Create an `AuthModule`.
    -   [ ] Implement the `/auth/register` endpoint:
        -   [ ] Validate incoming data (username, email, password).
        -   [ ] Use the `bcrypt` library to hash the user's password. **Never store plain text passwords!**
        -   [ ] Save the new user to the database via the `UserService`.
    -   [ ] Implement the `/auth/login` endpoint:
        -   [ ] Validate incoming data.
        -   [ ] Find the user in the database.
        -   [ ] Use `bcrypt` to compare the provided password with the stored hash.
        -   [ ] If valid, generate a JSON Web Token (JWT) for the user.
    -   [ ] Implement JWT Strategy & Guards:
        -   [ ] Configure the `@nestjs/jwt` module.
        -   [ ] Create a JWT strategy to validate incoming tokens on protected requests.
        -   [ ] Create a `JwtAuthGuard` that can be applied to routes that require a user to be logged in.
    -   [ ] Create a protected test route (e.g., `/profile`) that uses the `JwtAuthGuard` to verify that authentication is working.

### 🌐 Frontend (React)

-   [ ] **API Communication:**
    -   [ ] Set up a service or utility (e.g., using `axios`) to handle all requests to the backend API.
-   [ ] **UI Pages & Components:**
    -   [ ] Create a `Register` page with a form for username, email, and password.
    -   [ ] Create a `Login` page with a form for username and password.
    -   [ ] Create a basic `Navbar` component that conditionally shows "Login/Register" or "Logout/Profile" based on auth state.
-   [ ] **State Management:**
    -   [ ] Implement a global state solution (e.g., React Context, Zustand, or Redux) to manage the user's authentication status.
    -   [ ] When a user logs in, store the received JWT securely (e.g., in an HttpOnly cookie managed by the backend, or in local storage).
    -   [ ] When a user logs out, clear the JWT and update the global state.
-   [ ] **Routing:**
    -   [ ] Set up a routing library (e.g., `react-router-dom`).
    -   [ ] Create "protected routes" that automatically redirect unauthenticated users to the `Login` page.

---

## Phase 2: Core Gameplay - Local Pong

**Goal:** Create a fully functional Pong game that can be played by two players on the same keyboard. This focuses on the game logic and rendering, without networking.

### 🌐 Frontend (React)

-   [ ] **Game Component:**
    -   [ ] Create a new page/route for the game (e.g., `/game`).
    -   [ ] Create a `<PongGame />` component to encapsulate all game logic and rendering.
-   [ ] **Rendering:**
    -   [ ] Use the HTML5 `<canvas>` element for drawing the game.
    -   [ ] Write rendering functions to draw the paddles, the ball, the middle line, and the scoreboard.
-   [ ] **Game Loop:**
    -   [ ] Implement the main game loop using `requestAnimationFrame` for smooth, efficient updates.
    -   [ ] Separate game logic (updating positions) from rendering logic (drawing on the canvas).
-   [ ] **Input Handling:**
    -   [ ] Add event listeners for `keydown` and `keyup` events.
    -   [ ] Map specific keys (e.g., 'W'/'S' for player 1, 'ArrowUp'/'ArrowDown' for player 2) to paddle movements.
-   [ ] **Game Logic:**
    -   [ ] Implement ball movement logic.
    -   [ ] Implement collision detection between the ball and the walls.
    -   [ ] Implement collision detection between the ball and the paddles.
    -   [ ] Implement the scoring logic for when a player misses the ball.
    -   [ ] Implement a win condition and a screen to declare the winner.

---

## Phase 3: Online Multiplayer & Social Features

**Goal:** Convert the local Pong game into a real-time, online multiplayer experience. Build out the foundational social features required by the project.

### 💾 Backend (NestJS)

-   [ ] **WebSocket Integration:**
    -   [ ] Integrate the `@nestjs/websockets` module.
    -   [ ] Create a `GameGateway` to handle all real-time game communication.
-   [ ] **Matchmaking & Game Rooms:**
    -   [ ] Implement a basic matchmaking queue where players can wait for an opponent.
    -   [ ] When two players are matched, create a unique "room" for their game.
    -   [ ] Implement the logic for players to join and leave rooms.
-   [ ] **Server-Side Game Logic:**
    -   [ ] Move the core game loop and physics calculations from the frontend to the `GameGateway`. The server should be the single source of truth for the game state (authoritative server).
    -   [ ] The server should receive player inputs (e.g., "paddle up"), update the game state, and broadcast the new state back to the clients in the room at a regular interval.
-   [ ] **Social Features:**
    -   [ ] Implement endpoints for adding/viewing/removing friends.
    -   [ ] Implement an endpoint to view a user's profile, including their game history (wins/losses).
    -   [ ] Create a `ChatGateway` to handle real-time chat messages.

### 🌐 Frontend (React)

-   [ ] **WebSocket Client:**
    -   [ ] Integrate a client-side WebSocket library like `socket.io-client`.
    -   [ ] Create a service to manage the WebSocket connection.
-   [ ] **UI/UX:**
    -   [ ] Create a "Lobby" or "Play" page where users can join the matchmaking queue.
    -   [ ] Create a "Live Games" list to spectate ongoing matches (Bonus).
    -   [ ] Create a `Profile` page to display user stats and manage friends.
    -   [ ] Create a `Chat` component for real-time messaging.
-   [ ] **Game Refactor:**
    -   [ ] Modify the `<PongGame />` component to be a "dumb" renderer. It should no longer contain game logic.
    -   [ ] The component should send user input (key presses) to the server via WebSockets.
    -   [ ] It should listen for "game state" events from the server and simply draw the state it receives.

---

## Phase 4 & Beyond: Module Completion & Final Polish

**Goal:** Implement additional features from the subject PDF to reach the required point total.

-   [ ] **Choose Modules:**
    -   [ ] Review the list of "Major" and "Minor" modules with your team.
    -   [ ] Select the modules you want to implement (e.g., OAuth2, 2FA, AI Opponent, Game Customization).
-   [ ] **Implementation:**
    -   [ ] Create new tasks and branches for each new feature.
-   [ ] **Final Checks:**
    -   [ ] Ensure all secrets and API keys are in a `.env` file and that `.env` is in `.gitignore`.
    -   [ ] Perform a final review to ensure no errors or warnings are present in the console or terminal.
    -   [ ] Test for browser compatibility (Chrome, Firefox, Safari).
    -   [ ] Write or update the main `README.md` file.
