# Frontend Bug Fix Guide — Reconnection + Avatar + UI/Accessibility

**Parent Issues:** #154 (Reconnection Testing), plus #251, #250, #260, #261, #262, #253, #252
**Date:** 2026-03-08
**Owner:** zamgar (frontend)
**Status:** NOT STARTED

---

## How to Use This Guide

This guide teaches you how to debug and fix frontend issues — not just what to change, but WHY and HOW to find the problem yourself. Each section has a learning objective. The quiz at the end gates you before coding.

---

## Gate Quiz — Answer Before Writing Any Code

Write your answers on paper. Come back to check them after reading the guide.

**Q1.** A user has a screen reader. Your form has `<input type="text" placeholder="Enter name" />` with no `<label>`. What does the screen reader announce when focus lands on that input?

**Q2.** You have `<img src="/uploads/avatars/abc.png" onError={(e) => { e.currentTarget.src = "/default.png" }} />`. The `onError` fires and swaps `src` to `/default.png`. But that file also 404s. What happens in the browser? What does the user see?

**Q3.** Your Vite dev server proxies `/uploads/*` to the backend container. After `make fclean` wipes the Docker volume, what files survive? What files are gone?

**Q4.** A React component stores module-level state (outside the component function). When does that state reset? When does it NOT reset?

---

## Issue Overview

### Closed Issues (verified fixed)
| Issue | Reason |
|-------|--------|
| #271 | Verified fixed — `handleForfeit()` uses game room presence, not socket presence (PR #266) |
| #268 | Verified fixed — no auth race condition; stale token on mount is expected behavior |

### Your Issues (frontend-only)
| Priority | Issue | Title | PR |
|----------|-------|-------|-----|
| P1 | #277 | Reconnect fails into "Game error" + "Waiting" | PR 2: `fix/reconnection-rejoin-flow` |
| P2 | #269 | Missing "Opponent reconnected" notification | PR 3: `fix/reconnection-notifications` |

### Shared Issues (frontend half — coordinate with mgodawat on backend)
| Priority | Issue | Title | PR |
|----------|-------|-------|-----|
| P0 | #273 | Bob can't move while Alice disconnected | PR 1: `fix/reconnection-board-active` |
| P3 | #274 | Can't reconnect to completed/forfeited game | PR 3: `fix/reconnection-notifications` |
| P4 | #280 | Inconsistent result/winner/duration on reopen | PR 3: `fix/reconnection-notifications` |

### Existing Issues (avatar + a11y + UI polish)
| Issue | Title | PR |
|-------|-------|-----|
| #251, #250 | Avatar 404 on scoreboard / after DB wipe | `fix/avatar-404` |
| #253, #252 | Missing form labels / accessibility | `fix/ui-polish-a11y` |
| #260 | Warning icon on disconnect banner | `fix/ui-polish-a11y` |
| #261 | Neutral gray for "Waiting for opponent" | `fix/ui-polish-a11y` |
| #262 | Remove close button from active game banner | `fix/ui-polish-a11y` |

---

# PART A — Reconnection Fixes

---

## PR 1: Fix Board Frozen During Opponent Disconnect (#273) — Frontend Half

**Branch:** `fix/reconnection-board-active`
**Closes:** #273

### Problem

When Alice disconnects, Bob can't make moves. The board appears frozen.

### Your Part (frontend investigation)

The backend may or may not block moves (mgodawat is checking). But independently, the frontend likely disables the board when `opponent_disconnected` fires.

**Investigation:**
1. Read `frontend/src/pages/game/state.ts` — find the `OPPONENT_DISCONNECTED` case. Does it set `canMove: false` or similar?
2. Read `frontend/src/pages/Game.tsx` — find the cell click handler. Is it gated by `opponentConnection` state?
3. If either disables the board: remove that gate. The game should remain playable while the opponent is disconnected.

### Fix Strategy

The game is server-authoritative. If the server accepts the move (it should — mgodawat confirms), the frontend should not block it. The `OPPONENT_DISCONNECTED` action should only trigger the warning banner + countdown, NOT disable the board.

### Files to Touch

| File | Potential Change |
|------|-----------------|
| `frontend/src/pages/game/state.ts` | Remove board-disable on `OPPONENT_DISCONNECTED` |
| `frontend/src/pages/Game.tsx` | Remove opponent-connection gate on move handler (if present) |

### Verification

1. Alice and Bob in game, Bob's turn
2. Close Alice's tab
3. Bob clicks a cell
4. **Expected:** Move registers. Board updates. Warning banner still visible.

---

## PR 2: Fix Reconnect "Game error" + "Waiting" Mixed State (#277)

**Branch:** `fix/reconnection-rejoin-flow`
**Closes:** #277

### Problem

When Alice reconnects (via bookmark or refresh), she intermittently lands on a broken screen showing "Game error" / "Connection lost" AND "Waiting for opponent" underneath. Must click "Try again" to rejoin. If Bob's forfeit timer expires before retry, the modal shows null/zero values.

### Root Cause Hypotheses

**Hypothesis A — Socket not ready when `join_game_room` fires:**
The Game page mounts and emits `join_game_room` immediately. But after a tab close + reopen, the socket.io client may still be reconnecting. The emit silently fails on a disconnected socket.

**Hypothesis B — Race between socket reconnect and page mount:**
Socket.io auto-reconnects when the tab reopens. The `connect` event fires and triggers SocketContext effects. Meanwhile, the Game page also mounts and tries to join. The events overlap.

**Hypothesis C — Stale `joinState` from previous session (most likely):**
The module-level `joinState` in `useGameSocketController.ts` (lines 39-43) persists across page navigations. If Alice's previous session set `joinState.joinedGameId = gameId`, the rejoin attempt is skipped because the dedup guard thinks she's already joined.

### Investigation Steps

1. Read `frontend/src/pages/game/useGameSocketController.ts` lines 39-43 and 406-453 — trace `joinState` lifecycle
2. Read `frontend/src/services/socket.service.ts` — does `connectSocket()` handle disconnected sockets?
3. Check: is there a `socket.connected` guard before emitting `join_game_room`?
4. Add a `console.log` before the `join_game_room` emit — does it fire? Does the socket report `connected: true`?

### Fix Strategy

**If Hypothesis C:** Reset `joinState.joinedGameId` when the socket disconnects or when the Game page unmounts. The dedup guard should track per-connection, not per-module-lifetime.

**If Hypothesis A:** Add a `socket.connected` check before emitting `join_game_room`. If not connected, listen for `connect` event and emit then.

**Also fix:** The forfeit modal showing null/zero values — ensure `game_forfeited` handler in `state.ts` has fallback values for missing data.

### Files to Touch

| File | Change |
|------|--------|
| `frontend/src/pages/game/useGameSocketController.ts` | Fix `joinState` lifecycle; add socket-ready guard |
| `frontend/src/services/socket.service.ts` | Handle reconnecting socket state |
| `frontend/src/pages/game/state.ts` | Fallback values in `GAME_FORFEITED` reducer case |

### Verification

1. Alice and Bob in game
2. Close Alice's tab
3. Alice reopens game via bookmark
4. **Expected:** Game restores on first load — no "Game error", no retry needed
5. Repeat 5 times — must be reliable every time

---

## PR 3: Reconnection Notifications + Ended-Game UI (#269, #274, #280) — Frontend Half

**Branch:** `fix/reconnection-notifications`
**Closes:** #269, #274, #280 (frontend parts)

### Sub-Fix A: Missing "Opponent reconnected" notification (#269)

#### Problem
When Alice reconnects, Bob doesn't see a toast/notification. The disconnect warning disappears but there's no positive feedback.

#### Root Cause
The backend emits `opponent_reconnected` when a forfeit timer is cancelled by a rejoin (gameRoom.handlers.ts ~line 191-197). The frontend handler in `useGameSocketController.ts` dispatches `OPPONENT_RECONNECTED` — but the UI in `Game.tsx` may not render a toast for it.

#### Fix
1. Check `useGameSocketController.ts` — does `opponent_reconnected` handler dispatch correctly?
2. In `state.ts`, add a notification field (e.g., `reconnectionToast: string | null`)
3. In `Game.tsx`, render a green auto-dismissing toast when `reconnectionToast` is set
4. Auto-clear the toast after 3-5 seconds via `useEffect`

#### Files to Touch

| File | Change |
|------|--------|
| `frontend/src/pages/game/useGameSocketController.ts` | Verify dispatch |
| `frontend/src/pages/game/state.ts` | Add `reconnectionToast` state |
| `frontend/src/pages/Game.tsx` | Render toast, auto-dismiss after 3-5s |

---

### Sub-Fix B: Ended-game UI (#274, #280)

#### Problem
- #274: Alice can't see the final state when reconnecting to a game that ended while she was offline
- #280: Both players see contradictory winner/duration when reopening a forfeited game

#### Root Cause
The `game_already_ended` handler in `useGameSocketController.ts` may redirect to lobby instead of showing the final state. The winner perspective logic may not correctly compare `winnerId` to the current user. Duration calculation may break when `finishedAt` or `startedAt` is null.

**Note:** mgodawat is fixing the backend payload to include full game state. Your job is to consume it correctly.

#### Fix
1. In `useGameSocketController.ts`, handle `game_already_ended` by dispatching a new action that sets the full game state + game-over modal
2. In `state.ts`, add a `GAME_ALREADY_ENDED` action that:
   - Sets `boardState`, `boardSize`, all player info
   - Resolves winner perspective: compare `winnerId` to `currentUserId`
   - If `winnerId === null` (abandoned, no winner): show "Game Abandoned"
   - If `winnerId === currentUserId`: show "You Won"
   - Else: show "You Lost" or "You Lost by Forfeit" (based on `status`)
3. Duration: `finishedAt && startedAt ? finishedAt - startedAt : null`. Show "—" if null.

#### Files to Touch

| File | Change |
|------|--------|
| `frontend/src/pages/game/useGameSocketController.ts` | Handle `game_already_ended` → dispatch full state |
| `frontend/src/pages/game/state.ts` | Add `GAME_ALREADY_ENDED` action with perspective logic |
| `frontend/src/pages/Game.tsx` | Render final board + correct game-over modal |

### Verification (all sub-fixes)

**Test A — Toast:**
1. Alice disconnects, reconnects within 30s
2. **Expected:** Bob sees green "Opponent reconnected" toast, auto-dismisses

**Test B — Ended game:**
1. Alice disconnects, Bob wins
2. Alice navigates to `/game/{gameId}`
3. **Expected:** Alice sees final board, "You Lost" modal

**Test C — Forfeited game consistency:**
1. Both leave, wait 30s, both reopen game URL
2. **Expected:** Winner sees "You Won", loser sees "You Lost by Forfeit". Duration accurate.

---

## ~~PR 5: Fix 401 on `/api/auth/me` After Login (#268)~~ — CLOSED

> **Verified fixed** on 2026-03-08. No auth race condition exists. Token is stored synchronously in `localStorage` before any re-render. The 401 was from a stale expired token on page mount (expected behavior — mount clears it, user logs in fresh).

---

# PART B — Avatar 404 + UI/Accessibility (Existing Issues)

---

## Part 1: Static Asset 404s (Issues #251, #250)

**Learning objective:** Understand the difference between bundled assets and runtime uploads, trace a 404 in DevTools, and fix the avatar fallback chain.

### 1.1 Two Kinds of Assets

**Bundled assets** live in `frontend/public/`. Vite copies them into the Docker image at build time. They survive `make fclean`.

**Runtime uploads** land in `backend/uploads/`. They're on a Docker bind mount. When you `docker compose down -v`, the database volume is wiped — but the bind mount survives because it's a host directory, not a named volume.

The bug: the Prisma schema sets every new user's `avatarUrl` to `"/uploads/avatars/default.png"`. But that file has never been created.

### 1.2 Diagnostic Method — Trace the 404

1. Open DevTools → Network tab → filter by "Img"
2. Reload the page
3. Find the failing request. Note the **exact URL**
4. Click it → "Initiator" tab tells you which JSX line made the request
5. Check: is the 404 on the primary `src` or on the `onError` fallback?

### 1.3 The Fix

**Place a `default.png` in `backend/uploads/avatars/` and commit it:**
```bash
cp frontend/public/default-avatar.png backend/uploads/avatars/default.png
git add backend/uploads/avatars/default.png
```

Update `.gitignore`:
```gitignore
backend/uploads/avatars/*
!backend/uploads/avatars/default.png
!backend/uploads/avatars/.gitkeep
```

**Avatar audit — all `<img>` elements already have `onError` fallback:**

| File | Has onError? |
|------|-------------|
| `Profile.tsx:412` | Yes |
| `UserSearch.tsx:86` | Yes |
| `Scoreboard.tsx:28` | Yes |
| `ConversationItem.tsx` | Yes |
| `MessageBubble.tsx` | Yes |
| `Navbar.tsx` | Yes |

### 1.4 Verification

- [ ] `docker compose down -v && make` → no broken image icons anywhere
- [ ] Create a new user → avatar displays correctly
- [ ] DevTools Console → zero 404 errors for avatars
- [ ] `ls backend/uploads/avatars/default.png` → file exists

---

## Part 2: Accessibility — Form Labels & Attributes (Issues #253, #252)

**Learning objective:** Understand why `<label htmlFor>` matters, fix a shared component to cascade the fix.

### 2.1 The Core Problem — `Input.tsx`

**File:** `frontend/src/components/Input.tsx:7-29`

The shared `Input` component renders a `<label>` but doesn't associate it:
```tsx
{label && <label className="text-sm text-pong-text/60">{label}</label>}
<input type={inputType} className={...} {...props} />
```

### 2.2 What to Change

1. Import `useId` from React
2. `const generatedId = useId();`
3. `const inputId = props.id || generatedId;`
4. Add `htmlFor={inputId}` to the `<label>`
5. Add `id={inputId}` and `name={props.name || inputId}` to the `<input>`

### 2.3 Profile.tsx Label

**File:** `frontend/src/pages/Profile.tsx:472`

Change `<p>` to `<label htmlFor="display-name">`. Keep the same classes.

### 2.4 Verification

- [ ] Click every label on Login, Signup, Profile → focus moves to the correct input
- [ ] No two inputs on the same page share the same `id`
- [ ] Browser autofill works on Login form
- [ ] `npm run lint` → zero new warnings

---

## Part 3: UI Polish (Issues #260, #261, #262)

### 3.1 Issue #260 — Warning Icon on Disconnect Banner

**File:** `frontend/src/pages/Game.tsx:216-232`

Add a warning SVG icon inline:
```tsx
<p className="flex items-center gap-2 text-sm font-semibold text-carrot-orange-700">
  <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
  </svg>
  {gameState.disconnectedOpponentName ?? "Opponent"} disconnected.
</p>
```

### 3.2 Issue #261 — Neutral Gray for "Waiting for Opponent"

**File:** `frontend/src/components/Game/TurnIndicator.tsx:22-26`

Fix color logic:
```tsx
const colorClass =
  textOverride !== ""
    ? "text-pong-text/60"
    : isYourTurn
      ? (currentPlayer === "X" ? "text-pong-accent" : "text-pong-secondary") + " animate-pulse"
      : "text-pong-text/60";
```

### 3.3 Issue #262 — Remove Close Button from ActiveGameBanner

**File:** `frontend/src/components/ActiveGameBanner.tsx`

Remove:
1. `const [dismissed, setDismissed] = useState(false);`
2. `|| dismissed` from the early return
3. The entire `<button>` element with the X icon

### 3.4 Verification

- [ ] Disconnect → warning banner shows with warning icon
- [ ] "Your turn" = colored + pulse, "Waiting" = neutral gray
- [ ] Active game banner → no close button
- [ ] Banner auto-dismisses on forfeit/game over

---

## Quiz Answers

<details>
<summary>Q1 — Screen reader with no label</summary>
A screen reader announces "text field" or reads the `placeholder` text. But `placeholder` is NOT a label substitute — it disappears when typing and isn't reliably announced. Fix: `<label htmlFor>` matching the input's `id`.
</details>

<details>
<summary>Q2 — onError fallback also 404s</summary>
When `onError` fires and sets a new `src` that also 404s, `onError` fires again → infinite loop. The browser throttles it. User sees a broken image icon. Fix: fallback must point to a guaranteed-present bundled asset.
</details>

<details>
<summary>Q3 — What survives make fclean?</summary>
Named volumes (DB data) are wiped. The bind mount (`backend/uploads/`) survives. But the DB references `default.png` which doesn't exist on disk → every avatar 404s. Files in `frontend/public/` survive (baked into Docker image).
</details>

<details>
<summary>Q4 — Module-level state lifecycle</summary>
Module-level state (outside the component function) persists across React re-renders AND route changes. It only resets on full page reload (or when the module is re-evaluated by HMR). This means `joinState` in `useGameSocketController.ts` survives tab navigation — which can cause stale dedup guards.
</details>

---

## Execution Order

### Reconnection fixes (coordinate with mgodawat):
```
1. PR 1 frontend half (fix/reconnection-board-active)
   └── #273 — Remove board-disable on opponent disconnect
   └── Wait for mgodawat to confirm backend doesn't block moves

2. PR 2 (fix/reconnection-rejoin-flow)
   └── #277 — Fix joinState lifecycle + socket-ready guard
   └── This is 100% your PR, no backend dependency

3. PR 3 frontend half (fix/reconnection-notifications)
   └── #269 — Add "Opponent reconnected" toast
   └── #274, #280 — Handle game_already_ended with correct perspective
   └── Depends on mgodawat's backend payload fix
```

### Avatar + UI/Accessibility (independent, can do anytime):
```
4. fix/avatar-404 — #251, #250
5. fix/ui-polish-a11y — #253, #252, #260, #261, #262
```

**Always run `cd frontend && npm run lint` before every commit.**

---

## Key Frontend Files

| Component | File Path |
|-----------|-----------|
| Game socket controller | `frontend/src/pages/game/useGameSocketController.ts` |
| Game state reducer | `frontend/src/pages/game/state.ts` |
| Game page | `frontend/src/pages/Game.tsx` |
| Socket service | `frontend/src/services/socket.service.ts` |
| Socket context | `frontend/src/context/SocketContext.tsx` |
| Auth context | `frontend/src/context/AuthContext.tsx` |
| API client | `frontend/src/lib/apiClient.ts` |
| Shared Input component | `frontend/src/components/Input.tsx` |
| Turn indicator | `frontend/src/components/Game/TurnIndicator.tsx` |
| Active game banner | `frontend/src/components/ActiveGameBanner.tsx` |
| Profile page | `frontend/src/pages/Profile.tsx` |
