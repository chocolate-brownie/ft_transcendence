# Backend Bug Fix Guide — Reconnection Testing (#154)

**Parent Issue:** #154 (Test Reconnection: Reopen Browser, Verify Resume)
**Date:** 2026-03-08
**Owner:** mgodawat (backend)
**Status:** PLANNING

---

## Issue Triage

### Closed / Resolved Issues
| Issue | Reason |
|-------|--------|
| #256 | Fixed — duplicate `opponent_disconnected` emit (PR #266) |
| #271 | Verified fixed — `handleForfeit()` uses game room presence (PR #266) |
| #268 | Verified fixed — no auth race condition; stale token on mount is expected |

### Duplicate Issues (deleted)
#221, #222, #270, #272, #275, #276, #278, #279 — all deleted as duplicates of canonical issues.

### Remaining Open Sub-Issues
| Priority | Issue | Title | Owner | PR |
|----------|-------|-------|-------|-----|
| P0 | #273 | Board frozen during opponent disconnect | Investigate (likely frontend-only) | — |
| P1 | #274 | Can't reconnect to completed/forfeited game | **Backend** + Frontend | `fix/reconnection-notifications` |
| P2 | #280 | Inconsistent result/winner/duration on reopen | **Backend** + Frontend | `fix/reconnection-notifications` |
| — | #269 | Missing "Opponent reconnected" toast | **zamgar** (frontend-only) | — |
| — | #277 | Reconnect "Game error" + "Waiting" mixed state | **zamgar** (frontend-only) | — |

---

## Your Work

### Step 1: Investigate #273 (board frozen) — confirm it's frontend-only

The `make_move` handler in `game.handlers.ts` does NOT check room membership or opponent socket presence. It only validates whose turn it is and game status. The backend accepts moves fine during opponent disconnect.

The bug is in `Game.tsx:154`:
```typescript
const boardDisabled =
    !isYourTurn ||
    gameState.isSendingMove ||
    gameState.opponentConnection === "disconnected";  // <-- THIS
```

**Action:** Confirm to zamgar that the backend accepts moves. #273 is frontend-only — zamgar removes `opponentConnection === "disconnected"` from `boardDisabled`. No backend PR needed.

### Step 2: PR for #274 + #280 (backend payloads)

**Branch:** `fix/reconnection-notifications`
**Closes:** #274, #280 (backend parts)

---

## PR: Backend Payloads for Ended-Game Rejoin (#274, #280)

### Problem A: `game_already_ended` payload incomplete (#274)

When a player navigates to `/game/{gameId}` for an ended game, the `join_game_room` handler emits `game_already_ended`. The payload currently uses `buildJoinedPayload()` which includes most fields. However:

- FINISHED and DRAW games need `winningLine` for the frontend to highlight the winning cells
- The frontend `game_already_ended` handler for FINISHED/DRAW redirects to lobby instead of showing the result

**File:** `backend/src/socket/handlers/gameRoom.handlers.ts` (lines 174-187)

**What the payload currently includes** (via `buildJoinedPayload`):
- `boardState`, `boardSize`, `currentTurn`, `status`, `winnerId`
- `player1`, `player2`, `player1Symbol`, `player2Symbol`
- `startedAt`, `finishedAt`, `yourSymbol`

**What's missing:**
- `winningLine` — not stored in the DB; needs to be recalculated from `boardState` for FINISHED games

**Fix options:**
1. Store `winningLine` in the DB when the game ends (in `game.handlers.ts` when processing game over)
2. OR recalculate it from `boardState` + `boardSize` when building the `game_already_ended` payload

Option 1 is cleaner — store once, read anywhere.

### Problem B: Duration shows "0:00" on reopened forfeited game (#280)

The `GAME_FORFEITED` payload dispatched by the frontend `game_already_ended` handler does NOT include a `duration` field. The elapsed timer in `Game.tsx` only runs when `serverStatus === "IN_PROGRESS"`, so it stays at 0 for ended games.

**Backend fix:** The payload already includes `startedAt` and `finishedAt`. No backend change needed — this is a frontend calculation issue. zamgar needs to compute duration from `finishedAt - startedAt` instead of relying on the live timer.

**However:** Ensure `finishedAt` is always set for ABANDONED games. Check `disconnection.service.ts:189` — yes, `finishedAt: new Date()` is set. Also check `handleBothDisconnected` at line 42 — yes, `finishedAt: new Date()` is set there too. Backend is correct.

### Winner perspective (#280)

The payload includes `winnerId` as a raw ID and `yourSymbol`. The frontend resolves perspective by comparing `winnerId` to player IDs. The backend payload is correct — this is a frontend rendering issue in the `game_already_ended` handler.

### Files to Touch

| File | Change |
|------|--------|
| `backend/src/socket/handlers/gameRoom.handlers.ts` | Add `winningLine` to `game_already_ended` payload for FINISHED games |
| `backend/src/socket/handlers/game.handlers.ts` OR `backend/prisma/schema.prisma` | Store `winningLine` in DB on game over (if not already stored) |

### Verification

1. Alice and Bob in game
2. Both leave (click "Grid Wars")
3. Wait 30s (forfeit fires)
4. Both navigate to `/game/{gameId}`
5. **Expected:** Server emits `game_already_ended` with complete payload including `winnerId`, `finishedAt`, `startedAt`

6. Play a game to completion (someone wins)
7. Both close tabs, reopen `/game/{gameId}`
8. **Expected:** `game_already_ended` includes `winningLine`

---

## Execution Order

```
Step 1: Confirm #273 is frontend-only
  └── Tell zamgar: backend accepts moves, remove boardDisabled gate
  └── No backend PR needed

Step 2: PR (fix/reconnection-notifications)
  └── Add winningLine to game_already_ended payload
  └── Optionally store winningLine in DB on game over
  └── Coordinate with zamgar on frontend consumption
  └── zamgar fixes: duration calc, winner perspective, FINISHED/DRAW rendering

Step 3: Run full #154 test suite (all 15 test cases) with zamgar
  └── Both devs test together — backend logs + frontend UI
  └── Update #154 with results, close if all pass
```

---

## Key Backend Files

| Component | File Path |
|-----------|-----------|
| Forfeit timer service | `backend/src/services/disconnection.service.ts` |
| Disconnect handler | `backend/src/socket/handlers/disconnection.handlers.ts` |
| Game room handlers | `backend/src/socket/handlers/gameRoom.handlers.ts` |
| Game move handler | `backend/src/socket/handlers/game.handlers.ts` |
| Matchmaking handlers | `backend/src/socket/handlers/matchmaking.handlers.ts` |
| Socket registration | `backend/src/socket/index.ts` |

---

## Pre-Coding Checklist

- [ ] Docker services running (`docker compose up`)
- [ ] Backend logs visible (`docker compose logs -f backend`)
- [ ] Two browser profiles for testing
- [ ] DevTools WS tab open on both browsers
- [ ] Fresh branch from `main`
- [ ] `cd backend && npm run lint` passes before starting
