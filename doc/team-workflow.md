# Team Workflow Guide — ft_transcendence

How we work together as a team. Read this if you're unsure about priorities, who does what, or how to coordinate with others.

---

## Parallel Work, Sequential Dependencies

We work on multiple things at the same time, but we respect the dependency chain. Some things must happen before others.

### The Two Independent Tracks

```
Track A (Social)                    Track B (Game)
──────────────                      ──────────────
Auth (signup/login)                 Game board UI
       │                                  │
       ▼                                  ▼
  User profiles                     Game logic (win detection)
       │                                  │
       ▼                                  ▼
  Friends system                    Remote multiplayer (WebSocket)
       │                                  │
       ▼                                  ▼
  Chat (real-time)                  Tournament / AI / Stats
```

Track A and Track B can run in parallel because they don't depend on each other until late integration.

**Rule:** Within a track, follow the order. Across tracks, work simultaneously.

**Example:** teammate_1 can build the game board while teammate_2 builds auth endpoints. They don't block each other. But teammate_3 cannot build remote multiplayer until the game logic exists.

---

## Role Responsibilities

### Tech Lead (mgodawat)

**Primary job: remove blockers, not write the most code.**

- Owns infrastructure (Docker, deployment, repo setup)
- Reviews every PR before it gets merged
- Defines API contracts when two people's work needs to connect
- Makes architectural decisions that affect multiple people
- Unblocks teammates when they're stuck

### Frontend Developer (teammate_1)

- Builds React pages, components, and UI
- Responsible for responsive design and TailwindCSS styling
- Tests their own work in Chrome before submitting a PR

### Backend Developer (teammate_2)

- Builds Express API endpoints and Prisma queries
- Responsible for input validation and error handling on all endpoints
- Tests their own endpoints (curl, Postman, or similar) before submitting a PR

### Fullstack / Real-Time Specialist (teammate_3)

- Builds Socket.io events for chat, multiplayer, and real-time features
- Bridges frontend and backend for anything that needs WebSocket
- Tests real-time features with multiple browser windows

### Product Owner / PM (teammate_4)

- Tracks progress on the GitHub Project board
- Tests completed features from a user's perspective
- Writes Privacy Policy and Terms of Service content
- Reports bugs as GitHub Issues

### Everyone

- Write clear commit messages
- Create PRs for all changes (no direct pushes to main)
- Explain your own code — you will be asked about it during evaluation

---

## How to Decide What to Work On

Ask this question: **"What is currently blocking the most people?"**

That thing is the highest priority.

**Early in the project:**
- Auth blocks everything (profiles, friends, chat, game history all need users)
- Auth is the first priority after infrastructure

**Mid-project:**
- Nothing blocks anyone — features are independent
- Everyone works on their assigned track
- Tech lead reviews PRs and catches integration issues early

**Late in the project:**
- Features are done, bugs need fixing
- Everyone tests features they didn't build
- Tech lead focuses on the mandatory subject requirements checklist

---

## How We Coordinate

### Daily Check-in (Discord)

Every day, post a short update in the Discord channel:

```
What I finished: <what you completed>
What I'm working on: <what you're doing today>
Blocked by: <anything stopping you, or "nothing">
```

This takes 2 minutes and prevents the situation where two people work on the same thing or someone is stuck for a full day without anyone knowing.

### Before Starting a Feature

1. Check if anyone else is already working on it (look at GitHub Issues / Project board)
2. Make sure its dependencies are done (check the dependency chain above)
3. Create your branch: `feature/your-feature-name`
4. Let the team know on Discord

### When You're Stuck

1. Spend 30 minutes trying to solve it yourself
2. If still stuck, ask on Discord with context: what you tried, what error you got, what you expected
3. If it's an architecture question, ask the Tech Lead
4. Don't stay stuck silently for a full day — that's a wasted day for the whole team

### When Your Feature Is Ready

1. Run `npm run lint` — fix any errors
2. Test it yourself (does it actually work?)
3. Push your branch and open a PR on GitHub
4. Tag a teammate for review
5. After approval, merge and delete the branch

---

## API Contracts

When frontend and backend need to connect, agree on the contract first. A contract is just: what URL, what request body, what response.

Example:

```
POST /api/auth/login
Request:  { "email": "user@example.com", "password": "mypassword" }
Response: { "token": "jwt-token-here", "user": { "id": 1, "username": "..." } }
Error:    { "error": "Invalid credentials" } with status 401
```

Write this down before either side starts coding. This way frontend and backend can work in parallel — frontend uses the agreed shape to build the UI, backend implements the endpoint to match.

The Tech Lead defines these contracts when they're not obvious.

---

## Integration Points (Where Bugs Hide)

The riskiest parts of the project are where two people's work meets:

| Integration Point | Who's Involved | Risk |
| :--- | :--- | :--- |
| Frontend auth ↔ Backend auth API | teammate_1 + teammate_2 | Request/response shape mismatch |
| Chat UI ↔ Socket.io events | teammate_1 + teammate_3 | Event names don't match, messages not received |
| Game board ↔ Game logic API | teammate_1 + teammate_2 | Board state format differs between frontend and backend |
| Multiplayer ↔ Game logic | teammate_3 + teammate_2 | Server validates moves differently than client expects |

**How to reduce risk:** Define the contract before building. Test the integration as soon as both sides have a basic version. Don't wait until Day 10 to connect frontend to backend for the first time.

---

## Common Mistakes to Avoid

**"I'll merge it later"** — Don't sit on a finished feature branch for days. Merge early and often. The longer a branch lives, the harder it is to merge.

**"It works on my machine"** — Always test inside Docker (`make fclean && make`). If it doesn't work in Docker, it doesn't work.

**"I'll fix it later"** — You won't. Fix it now or create a GitHub Issue so it doesn't get forgotten.

**"I'll just push to main quickly"** — Main is protected. Even for small fixes, create a branch and PR. This is how we catch mistakes before they affect everyone.

**"I don't need a review for this"** — Yes you do. Every change gets reviewed. A second pair of eyes catches bugs that you're blind to because you wrote the code.

---

## Timeline Reference

| Days | Focus | Everyone's priority |
| :--- | :--- | :--- |
| 1 | Foundation | Get local environment working |
| 2–3 | Auth + profiles | Make user system solid |
| 3–4 | Social features + game start | Friends, chat, game board |
| 5–6 | Game complete + multiplayer | Two players can play remotely |
| 7 | Tournament system | Bracket play working |
| 8–9 | Bonus modules | AI, customization, stats |
| 10 | Integration + first bug pass | Everything connected, initial fixes |
| 11–13 | Deep testing | Everyone tests everything |
| 14 | Mandatory checks | Subject requirements verified |
| 15 | Submission prep | README, evaluation practice |

See [implementation_plan.md](implementation_plan.md) for detailed daily breakdowns.
