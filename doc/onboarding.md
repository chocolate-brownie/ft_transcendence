# Team Onboarding Guide — ft_transcendence

Welcome to the team! This guide will get you from zero to contributing in about 30 minutes.

---

## Step 1: Clone the Repository

```bash
git clone <repo-url>
cd ft_transcendence
```

## Step 2: Environment Setup

```bash
cp .env.example .env
```

The defaults in `.env.example` work for local development — no changes needed.

## Step 3: Install Docker

**Linux Mint / Ubuntu / Debian:**

```bash
sudo apt update
sudo apt install docker.io docker-compose-v2
sudo usermod -aG docker $USER
newgrp docker
sudo systemctl enable docker
sudo systemctl start docker
```

**Fedora:**

```bash
sudo dnf install docker docker-compose-plugin
sudo systemctl enable docker && sudo systemctl start docker
sudo usermod -aG docker $USER && newgrp docker
```

**macOS:** Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and launch it.

## Step 4: Install Local Dependencies (for your editor)

```bash
cd backend && npm install
cd ../frontend && npm install
cd ..
```

This gives your editor (VSCode, Zed, etc.) autocomplete and type checking.

## Step 5: Start the Application

```bash
make
```

**Verify the app is working:**

1. Open **http://localhost:5173** in Chrome — you should see a System Status page showing connection indicators for the backend and database.
2. Open **https://localhost:3000/api/health** — Chrome will show a security warning (self-signed certificate). Click **"Advanced" → "Proceed to localhost (unsafe)"**. You should see:

```json
{ "status": "ok", "timestamp": "...", "database": "connected" }
```

3. Go back to **http://localhost:5173** and refresh — all status indicators should be green.

If the frontend shows red indicators, make sure you completed step 2 first (accepting the SSL certificate).
Verify: `make ps` should show three containers with status `Up`.

## Step 6: Project Structure

```
ft_transcendence/
├── Makefile                        # make, make down, make logs, make fclean, etc.
├── docker-compose.yml              # 3 services: frontend, backend, db
├── .env / .env.example             # Environment variables
├── backend/
│   ├── prisma/schema.prisma        # DATABASE SCHEMA — read this first!
│   └── src/
│       ├── index.ts                # Server setup + route mounting
│       ├── lib/prisma.ts           # Shared Prisma client
│       ├── middleware/auth.ts      # JWT verification
│       ├── routes/                 # URL definitions (*.routes.ts)
│       ├── controllers/            # HTTP request/response handling
│       └── services/               # Business logic (no HTTP concepts)
├── frontend/
│   └── src/
│       ├── main.tsx                # React entry point
│       ├── App.tsx                 # React Router + Layout
│       ├── pages/                  # One component per route
│       ├── components/             # Reusable UI (Navbar, Footer, etc.)
│       ├── context/                # React Context (auth state, etc.)
│       ├── services/               # API call functions
│       └── types/index.ts          # TypeScript interfaces
└── doc/
    ├── implementation_plan.md      # Architecture + timeline
    ├── tasks.md                    # YOUR TASKS — find your role here
    └── subject.md                  # 42 project requirements
```

**Backend architecture:** Routes define URLs → Controllers handle HTTP → Services contain logic. See `doc/implementation_plan.md` for details.

**Read in this order:** tasks.md → implementation_plan.md → schema.prisma → backend/src/index.ts → frontend/src/App.tsx

## Step 7: Find Your Tasks

Open `doc/tasks.md` and find tasks tagged with your role:

| Role      | Focus                                  |
| :-------- | :------------------------------------- |
| Tech Lead | Docker, HTTPS, code reviews            |
| Frontend  | React pages, TailwindCSS, game board   |
| Backend   | Express API, Prisma, auth, AI logic    |
| Real-Time | Socket.io, multiplayer, chat           |
| PM        | GitHub Issues, QA, Privacy Policy, ToS |

## Step 8: Git Workflow

**`main` is protected — you cannot push to it directly.** All changes go through Pull Requests.

### Branch naming convention

```
feature/<short-description>   — new functionality
fix/<short-description>       — bug fixes
docs/<short-description>      — documentation only
```

### Workflow

```bash
git checkout main && git pull
git checkout -b feature/your-feature-name    # e.g. feature/auth-signup
# ... work on your feature ...
git add . && git commit -m "feat: add login page"
git push origin feature/your-feature-name
# Then create a Pull Request on GitHub — requires 1 approval before merging
```

### Rules

- One branch per task. Keep branches small and focused.
- Get at least 1 code review before merging.
- Delete your branch after merging (GitHub can do this automatically).
- Pull `main` before creating a new branch to avoid stale code.

## Step 9: Useful Commands

| Command           | What it does               |
| :---------------- | :------------------------- |
| `make`            | Build and start everything |
| `make down`       | Stop containers            |
| `make logs`       | Live logs (all services)   |
| `make logs-back`  | Backend logs only          |
| `make ps`         | Container status           |
| `make shell-back` | Shell inside backend       |
| `make shell-db`   | PostgreSQL CLI             |
| `make fclean`     | Remove everything          |
| `make re`         | Full rebuild               |

**When to rebuild:** Changed package.json or Dockerfile → `make re`. Changed source code → no rebuild (hot reload).

## Step 10: How Data Flows

```
User clicks "Login"
  → React sends POST /api/auth/login { email, password }
  → Express receives request
  → Prisma queries PostgreSQL
  → Express returns JWT token
  → React stores token, redirects to home
```

## Troubleshooting

| Problem                      | Fix                                                          |
| :--------------------------- | :----------------------------------------------------------- |
| Docker permission denied     | `sudo usermod -aG docker $USER && newgrp docker`             |
| Docker daemon not running    | `sudo systemctl start docker`                                |
| Editor red squiggles         | `cd backend && npm install && cd ../frontend && npm install` |
| Port already in use          | `make fclean && make`                                        |
| Pulled changes, things broke | `make re`                                                    |

## Communication

- **Discord** for daily updates
- **GitHub Issues** for bugs
- **Pull Requests** for code review

Daily check-in: What did you finish? What are you working on? Are you blocked?

## Quick Links

- React: https://react.dev
- Express: https://expressjs.com
- Prisma: https://prisma.io/docs
- Socket.io: https://socket.io/docs/v4
- TailwindCSS: https://tailwindcss.com/docs
