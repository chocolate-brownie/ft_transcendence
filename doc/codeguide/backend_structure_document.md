# Backend Structure Document

## 1. Backend Architecture

The backend of **ft_transcendence** is organized as a single, containerized service that handles both HTTP (REST) and WebSocket traffic. It follows clear separation of concerns and common design patterns to stay maintainable and scalable:

- **Frameworks & Languages**
  - Express.js (HTTP server and REST endpoints)
  - Socket.io (real-time WebSocket events)
  - Node.js runtime with TypeScript for type safety
- **Modular Structure**
  - **Controllers/Routes** handle incoming requests and delegate to
  - **Services** that implement business logic (game rules, chat, AI), which in turn use
  - **Repositories** built on Prisma ORM to interact with the database
- **Scalability**
  - Stateless containers: user sessions are JWT-based, so any instance can serve any request
  - Socket.io supports a Redis adapter for pub/sub across multiple nodes (easy to add)
  - Docker Compose allows spinning up multiple backend replicas behind a load balancer
- **Maintainability**
  - TypeScript enforces consistent data shapes across controllers, services, and ORM
  - ESLint/Prettier, pre-commit hooks, and 90%+ test coverage keep code quality high
  - Clear folder structure: `/routes`, `/controllers`, `/services`, `/prisma`, `/utils`
- **Performance**
  - WebSocket rooms isolate events to only relevant clients (players, chat participants)
  - Optimized Prisma queries with indexing on keys (user ID, game ID) and Prisma transactions for atomic updates
  - AI Minimax logic runs server-side in a dedicated module, keeping response times under 150ms

## 2. Database Management

- **Type**: Relational (SQL)
- **System**: PostgreSQL
- **ORM**: Prisma Client (auto-generated TypeScript queries)

How data is handled:
- **Schema Migrations**: Prisma Migrate manages versioned migrations in `prisma/migrations`
- **Connection Pooling**: Managed by Prisma under the hood, with environment-controlled pool sizes
- **Data Integrity**
  - Foreign-key constraints link Users, Games, Messages, Tournaments, and Friendships
  - Unique constraints on emails, usernames, tournament slots
- **Transactions**
  - Game result updates (win/loss/draw) always in a single transaction to avoid race conditions
  - Tournament bracket updates wrapped in transactions for consistency
- **Backup & Retention**
  - Daily dump of PostgreSQL database to secure storage (scripts triggered via cron in the host environment)

## 3. Database Schema

Below is a human-readable overview of the main tables and their relationships. A PostgreSQL DDL snippet follows.

Users
- **id**: auto-increment integer primary key
- **email**: unique string
- **hashed_password**: string
- **display_name**: string
- **avatar_url**: string (optional)
- **bio**: text (optional)
- **created_at**: timestamp
- **statistics**: wins, losses, draws as integers

Games
- **id**: auto-increment integer
- **mode**: enum (REMOTE, AI, LOCAL)
- **state**: JSON representing the board
- **status**: enum (IN_PROGRESS, COMPLETED)
- **turn**: enum (X, O)
- **player_x_id**, **player_o_id**: foreign keys to Users (O may be null for AI/local)
- **created_at**, **updated_at**: timestamps

Messages
- **id**: auto-increment integer
- **sender_id**: FK to Users
- **target_user_id**: FK to Users (for direct messages) or null
- **game_id**: FK to Games (optional chat in game)
- **content**: text
- **sent_at**: timestamp

Friendships
- **id**: auto-increment integer
- **requester_id**, **receiver_id**: FKs to Users
- **status**: enum (PENDING, ACCEPTED)
- **created_at**: timestamp

Tournaments
- **id**: auto-increment integer
- **name**: string
- **status**: enum (OPEN, ONGOING, FINISHED)
- **bracket**: JSON representing rounds and matchups
- **created_at**, **updated_at**: timestamps

TournamentMatches (child of Tournaments)
- **id**, **tournament_id**: FK
- **round**: integer
- **player1_id**, **player2_id**: FKs to Users
- **result**: enum (P1_WIN, P2_WIN, DRAW)
- **scheduled_at**, **completed_at**: timestamps

SQL Schema Snippet (PostgreSQL)
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  wins INT NOT NULL DEFAULT 0,
  losses INT NOT NULL DEFAULT 0,
  draws INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE game_mode AS ENUM ('REMOTE','AI','LOCAL');
CREATE TYPE game_status AS ENUM ('IN_PROGRESS','COMPLETED');
CREATE TYPE turn_symbol AS ENUM ('X','O');

CREATE TABLE games (
  id SERIAL PRIMARY KEY,
  mode game_mode NOT NULL,
  state JSONB NOT NULL,
  status game_status NOT NULL,
  turn turn_symbol NOT NULL,
  player_x_id INT REFERENCES users(id) ON DELETE CASCADE,
  player_o_id INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  sender_id INT REFERENCES users(id) ON DELETE CASCADE,
  target_user_id INT REFERENCES users(id) ON DELETE CASCADE,
  game_id INT REFERENCES games(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE friendship_status AS ENUM ('PENDING','ACCEPTED');
CREATE TABLE friendships (
  id SERIAL PRIMARY KEY,
  requester_id INT REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INT REFERENCES users(id) ON DELETE CASCADE,
  status friendship_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(requester_id, receiver_id)
);

CREATE TYPE tournament_status AS ENUM ('OPEN','ONGOING','FINISHED');
CREATE TABLE tournaments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  status tournament_status NOT NULL DEFAULT 'OPEN',
  bracket JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tournament_matches (
  id SERIAL PRIMARY KEY,
  tournament_id INT REFERENCES tournaments(id) ON DELETE CASCADE,
  round INT NOT NULL,
  player1_id INT REFERENCES users(id),
  player2_id INT REFERENCES users(id),
  result TEXT,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

## 4. API Design and Endpoints

The backend exposes both RESTful HTTP endpoints and WebSocket events:

### REST Endpoints (Express)
- **POST /api/auth/signup**  
  Registers a new user. Returns JWT on success.
- **POST /api/auth/login**  
  Validates credentials, returns JWT.
- **POST /api/auth/forgot-password**  
  Triggers email with reset link via Nodemailer.
- **POST /api/auth/reset-password**  
  Verifies token and updates password.

- **GET /api/users/me**  
  Returns current user profile. JWT in `Authorization` header.
- **PUT /api/users/me**  
  Updates display name, bio, avatar.

- **GET /api/friends**  
  Lists accepted friends and their status.
- **POST /api/friends/request**  
  Sends a friend request to another user.
- **POST /api/friends/:id/accept**  
  Accepts incoming friend request.
- **DELETE /api/friends/:id**  
  Removes a friend.

- **GET /api/tournaments**  
  Lists open and ongoing tournaments.
- **POST /api/tournaments**  
  Creates a new tournament (admin or user-driven).
- **POST /api/tournaments/:id/join**  
  Registers current user in bracket.

- **GET /api/leaderboard**  
  Returns paginated ranking by win rate.

### WebSocket Events (Socket.io)
- **`join_queue`**  
  Client requests matchmaking for online game.
- **`start_game`**  
  Server emits when two players are paired.
- **`move`**  
  Client emits a board move. Server validates, updates DB, broadcasts new state.
- **`chat_message`**  
  Client emits; server persists and broadcasts to room or friend.
- **`friend_notification`**  
  Server pushes real-time updates on requests and acceptances.
- **`tournament_update`**  
  Server broadcasts bracket changes in real time.

## 5. Hosting Solutions

- **Containerized Deployment**
  - Docker + Docker Compose for local development and staging
  - Images pushed to a container registry (Docker Hub or private)
- **Production Environment**
  - Deploy containers on a cloud provider supporting Docker (e.g., AWS ECS, Azure Container Instances, DigitalOcean App Platform)
  - Use environment variables for secrets (DB URL, JWT secret, SMTP creds)
- **Benefits**
  - Consistent environments across local, staging, and production
  - Easy horizontal scaling by running multiple container replicas
  - Cost-effective: pay only for the containers you run
  - High availability: orchestrator restarts unhealthy containers automatically

## 6. Infrastructure Components

- **Load Balancer / Reverse Proxy**
  - NGINX, Traefik, or cloud-managed LB for SSL termination and routing HTTP/WebSocket to containers
- **Caching**
  - *Optional:* Redis for Socket.io adapter (scaling real-time events across instances) and session caching
  - HTTP caching headers for static assets served via CDN
- **Content Delivery Network (CDN)**
  - Host static files (frontend build) on Cloudflare/AWS CloudFront for global speed
- **Message Broker (Future-proof)**
  - Redis Pub/Sub or RabbitMQ can be added to decouple notification logic and support larger scale

## 7. Security Measures

- **Authentication & Authorization**
  - JWT tokens with 256-bit secrets for all protected REST routes and WebSocket handshakes
  - Bcrypt hashing of passwords with salt rounds
  - Express middleware (`express-validator`) for input validation and sanitization
  - Role checks (e.g., tournament admin privileges) enforced in route handlers
- **Network Security**
  - Enforce HTTPS/TLS in production (via proxy or LB)
  - CORS policy configured to allow only trusted origins
  - Rate limiting on auth endpoints to guard against brute-force attacks
- **Data Protection**
  - Environment variables for secrets (no hard-coded credentials)
  - PostgreSQL user with minimal privileges
  - GDPR-compatible deletion on account removal
- **Additional Safeguards**
  - Helmet middleware for secure HTTP headers
  - CSRF not required for token-based API, but review if adding cookie-based auth

## 8. Monitoring and Maintenance

- **Logging**
  - Structured logs (Winston or similar) in JSON format
  - Log levels (info, warn, error) and central aggregation (e.g., ELK Stack)
- **Metrics & Alerts**
  - Expose a `/healthz` and `/metrics` endpoint
  - Integrate Prometheus + Grafana for CPU, memory, request rates, WebSocket connections
  - Alert on high error rates or CPU/memory spikes
- **Error Tracking**
  - Sentry or equivalent for uncaught exceptions and performance tracing
- **Automated Tests**
  - Unit tests for game logic, integration tests for REST endpoints and WebSocket flows
  - 90%+ coverage on core modules
  - CI pipeline (GitHub Actions) runs lint, tests, and build on each pull request
- **Maintenance**
  - Weekly dependency checks (Dependabot)
  - Monthly security reviews and container image updates
  - Daily database backups with retention policy (e.g., 30 days)

## 9. Conclusion and Overall Backend Summary

The **ft_transcendence** backend is a robust, containerized service built on Express.js, Socket.io, and Prisma + PostgreSQL. It:

- **Delivers real-time multiplayer** Tic-Tac-Toe matches, chat, and notifications via WebSockets
- **Maintains data integrity** with relational schema, migrations, and transactional updates
- **Stays secure** through JWT, bcrypt hashing, validation middleware, and HTTPS
- **Scales seamlessly** by running stateless containers behind load balancers, with a path to add Redis for session or pub/sub
- **Remains maintainable** thanks to TypeScript, strict linting, high test coverage, and automated CI/CD

Unique aspects include an AI opponent powered by the Minimax algorithm, a bracket-style tournament system integrated in the same backend, and a one-command Docker Compose setup that ensures parity from local development to production. This architecture fully supports the project’s goals of low-latency play, social features, competitive tournaments, and developer productivity.