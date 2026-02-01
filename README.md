### **Project Architecture Overview**

We have established a **Dockerized Microservices Architecture** that separates concerns between data, backend logic, and frontend presentation. This setup ensures consistency across all development environments and meets the project requirement for a single-command deployment.

**1. Infrastructure & Orchestration**

- **Docker Compose:** Used to orchestrate the entire application stack.
- **Hot-Reloading:** Configured volume mounts (`volumes`) in `docker-compose.yml` to sync local file changes with the containers instantly. This allows for real-time development without rebuilding containers.
- **Networking:** All services communicate via a dedicated internal bridge network (`trans_net` or default).

**2. Backend Service (`/backend`)**

- **Framework:** **NestJS** (Node.js framework).
- **Role:** Acts as the API Gateway and logic handler. It connects to the database and serves data to the frontend.
- **Status:** Initialized with the standard NestJS boilerplate (`@nestjs/cli`).
- **Dockerfile:** Uses `node:18-alpine` for a lightweight image. Configured to run in development mode (`npm run start:dev`).

**3. Frontend Service (`/frontend`)**

- **Framework:** **React** (via Vite).
- **Language:** **TypeScript** for type safety and better developer experience.
- **Role:** The client-side application user interface.
- **Status:** Initialized using `npm create vite@latest`.
- **Dockerfile:** Exposes port `5173` and runs Vite with the `--host` flag to allow access from outside the Docker container.

**4. Database Service (`db`)**

- **System:** **PostgreSQL** 15.
- **Role:** Persistent storage for user data, game history, and relationships.
- **Configuration:** Protected by environment variables (`POSTGRES_USER`, `POSTGRES_PASSWORD`) defined in `docker-compose.yml`.

---

### **How to Run the Project**

**Prerequisites:**

- Docker & Docker Compose
- Node.js (for local tooling, optional)

**Installation & Launch:**

1. Clone the repository.
2. Start the application with a single command:

```bash
docker-compose up --build

```

3. Access the application:

- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:3000`

---
