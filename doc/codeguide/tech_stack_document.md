# Tech Stack Document for ft_transcendence

This document explains the technology choices behind **ft_transcendence**, a real-time, multiplayer Tic-Tac-Toe platform. It’s written in everyday language so anyone can understand why each technology was chosen and how it fits into the project.

## 1. Frontend Technologies
These are the tools and libraries that power the part of the application you see and interact with in your browser.

- **React (with Vite)**
  - Why: React makes it easy to build dynamic interfaces in a modular way. Vite speeds up development and initial page load times.
- **TypeScript**
  - Why: Adds simple checks to catch mistakes early (for example, ensuring you don’t accidentally treat text like a number).
- **TailwindCSS**
  - Why: Offers ready-to-use styling classes so designers and developers can quickly create attractive layouts without writing lots of custom CSS.
- **React Context API** (for Authentication)
  - Why: Keeps track of who’s logged in across all pages without extra setup.
- **Socket.io Client**
  - Why: Enables real-time updates (for moves, chat messages, friend status) without needing to refresh the page.
- **ESLint & Prettier**
  - Why: Automatically formats and checks code style so the codebase stays clean and consistent.

How it enhances the user experience:
- Instant updates when an opponent makes a move or sends a chat message.
- Smooth page transitions and fast loading thanks to Vite and React’s component-based design.
- Consistent look and feel across all screens with TailwindCSS.

## 2. Backend Technologies
These technologies power the server side, handling data storage, business logic, and real-time communication.

- **Node.js & Express.js**
  - Why: A popular, lightweight server framework that runs JavaScript (and TypeScript) with minimal setup.
- **TypeScript**
  - Why: Lets us catch errors while coding, rather than at runtime, and provides clear documentation of data structures.
- **Prisma ORM** (with PostgreSQL)
  - Why: Simplifies database operations with a type-safe interface and automatic migration management.
- **PostgreSQL**
  - Why: A reliable, open-source database well suited to structured, relational data (users, games, messages, tournaments).
- **Socket.io Server**
  - Why: Manages WebSocket connections and rooms to enable real-time gameplay and chat.
- **JWT (JSON Web Tokens) & bcrypt**
  - Why: Securely authenticate users and hash passwords so that sensitive data is protected.
- **Nodemailer (or equivalent email service)**
  - Why: Sends password-reset emails and other notifications.

How these components work together:
1. A user logs in and receives a JWT token.  
2. The token authorizes access to protected API endpoints in Express.  
3. Database reads and writes go through Prisma, ensuring data stays consistent.  
4. Real-time events (moves, chat) flow through Socket.io, with the server acting as the single source of truth.  

## 3. Infrastructure and Deployment
These tools and practices make it easy to deploy, scale, and maintain the application.

- **Docker & Docker Compose**
  - Why: Packages the frontend, backend, and database into isolated containers so setup is identical on any machine.
- **Makefile**
  - Why: Provides simple commands (e.g., `make up`, `make down`) to build and run the entire system with one line.
- **Git & GitHub (or equivalent)**
  - Why: Version control system to track changes, handle code review, and collaborate safely.
- **(Optional) CI/CD Pipeline** (e.g., GitHub Actions)
  - Why: Automatically runs linting, tests, and builds on each commit to catch issues early.
- **Environment Variables & Dotenv**
  - Why: Keeps sensitive settings (database URL, email credentials) out of the source code.

How these choices help:
- **Reliability:** Containers isolate faults—if one service fails, others remain unaffected.  
- **Scalability:** You can add more backend or WebSocket instances behind a load balancer.  
- **Ease of deployment:** Anyone can clone the repo, run `docker-compose up`, and have a working system.

## 4. Third-Party Integrations
These external services add extra functionality without reinventing the wheel.

- **Email Service (SMTP via Nodemailer or SendGrid, Mailgun, etc.)**
  - Benefit: Handles password-reset emails, account confirmations, and notifications.
- **Hosting & Container Registry** (e.g., Docker Hub, AWS ECR)
  - Benefit: Stores your Docker images for easy deployment to production servers.

How they enhance functionality:
- Users get timely password recovery messages.  
- Deployment pipelines can pull prebuilt images quickly, speeding up releases.

## 5. Security and Performance Considerations
Measures taken to keep data safe and ensure smooth gameplay.

Security:
- **Password Hashing (bcrypt):** User passwords are never stored in plain text.  
- **JWT Authentication:** Protects each API route and the WebSocket handshake so only legitimate users connect.  
- **CORS & Rate Limiting:** Prevents unauthorized cross-site requests and brute-force login attempts.  
- **HTTPS in Production:** Encrypts data in transit (TLS certificates via Let’s Encrypt or a managed provider).

Performance Optimizations:
- **Socket.io Rooms & Namespaces:** Limits real-time messages to only the players and chat participants who need them.  
- **Prisma Query Efficiency:** Uses indexing and selective queries to avoid unnecessary data transfers.  
- **Client-Side Prediction & Reconciliation:** The frontend immediately shows a player’s move, then adjusts if the server state differs (gives a feel of near-instant response).  
- **Multi-Stage Docker Builds:** Keeps production images lean for faster startup.  

## 6. Conclusion and Overall Tech Stack Summary
**Recap of Choices and Alignment with Goals:**
- **User Experience:** React + Tailwind + Socket.io deliver a fast, interactive, and modern interface.  
- **Data Integrity & Security:** Express + Prisma + PostgreSQL + JWT ensure secure sign-ups, reliable data storage, and safe real-time sessions.  
- **Developer Productivity:** TypeScript, Vite, ESLint/Prettier, and Docker Compose simplify coding, testing, and deployment.  
- **Scalability & Reliability:** Containerization, clear CI/CD practices, and performance optimizations set the stage for future growth.

**Unique Aspects:**
- A fully containerized development and production environment—run the whole platform locally or in the cloud with one command.
- Real-time game logic combined with social features (chat, friend system, tournaments) in a single cohesive stack.
- AI opponent mode powered by the Minimax algorithm baked into the same backend, eliminating extra services.

By choosing these technologies, **ft_transcendence** meets its goals of secure authentication, real-time gameplay, rich social interactions, and a smooth user experience—all while remaining easy to develop, deploy, and maintain.