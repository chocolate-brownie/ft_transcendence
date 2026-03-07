# Phase A: Forfeit Idempotency — Learning-Oriented Bug Fix Guide

**Issues:** #255, #249, #248
**Branch:** `fix/forfeit-idempotency`
**Status:** NOT STARTED

---

## How to Use This Guide

This is not a copy-paste fix list. It teaches you **how to find and fix timer race conditions** in event-driven code. Each section builds on the last. Do not skip ahead.

After Phase A is complete (PR merged), this file will be updated with Phase B.

---

## Part 1: The Diagnostic Method — "Why Does X Happen Twice?"

**Learning objective:** Given any "event fires twice" symptom, produce a ranked list of causal hypotheses.

### 1.1 Start With the Symptom

When you see "forfeit fires twice" (#255), resist the urge to search for `handleForfeit` immediately. Write down what *twice* implies structurally:

- Is there **one caller** that runs twice? Or **two separate callers** that each run once?
- If two callers: do they share state? Can either one observe that the other already ran?
- If one caller: is it registered to an event that fires multiple times?

These are different root causes requiring different fixes.

### 1.2 Map the Call Graph Before Reading Code

Draw on paper the paths that lead to `handleForfeit()`. Don't read line-by-line yet — scan only for:

1. Where are timers **started**?
2. Where is `handleForfeit` **called**?
3. Where are timers **cancelled**?

**Your task:** Open these 3 files and build those 3 lists:
- `backend/src/services/disconnection.service.ts`
- `backend/src/socket/handlers/matchmaking.handlers.ts`
- `backend/src/socket/handlers/gameRoom.handlers.ts`

Write your findings down before continuing.

### 1.3 The Signature You're Looking For

The "two callers, no shared state" pattern:

```
Event A fires -> calls handleForfeit() -> updates DB, emits socket event
Event B fires -> calls handleForfeit() -> updates DB, emits socket event (again)
```

...and there is nothing between "calls" and "updates" that says "stop if already done."

If you found this pattern in your scan, you've identified the root cause family. Keep reading.

---

## Part 2: Idempotency — The Core Concept

**Learning objective:** Define idempotency operationally, explain why it matters in async systems, and identify what makes a function non-idempotent.

### 2.1 The Operational Definition

For event-driven code, idempotency means: **calling this function N times with the same game context produces the same observable outcome as calling it once.**

"Observable outcome" = database state + socket events emitted to clients.

A function that writes to the DB once is idempotent on the DB side. The same function that emits a socket event again on the second call is NOT idempotent on the socket side.

**Analogy:** A light switch with a physical lock at the "off" position. You can press it 10 times — it stays off after the first press. The lock is the guard. Without the lock, each press is an independent operation.

### 2.2 What Makes `handleForfeit` Non-Idempotent

Read `disconnection.service.ts` lines 99-144. Answer these before continuing:

1. Does `handleForfeit()` check the game's current status before writing to the DB?
2. Does it check anything before emitting the socket event?
3. The `catch` block handles Prisma error P2025 (record not found). Does a game being already ABANDONED cause P2025? Or does the update silently succeed?

**Answers you should arrive at:**
- No status check before `prisma.game.update()` at line ~108
- No check before `io.to(roomName).emit()` at line ~129
- P2025 only fires if the row is deleted entirely. An already-ABANDONED game just gets overwritten silently.

### 2.3 Terminal States Are Your Guard

In any state machine, **terminal states** are natural idempotency guards:

```
IN_PROGRESS -> FINISHED  (normal win/draw)
IN_PROGRESS -> ABANDONED (forfeit or both disconnect)
FINISHED    -> (terminal — no further transitions)
ABANDONED   -> (terminal — no further transitions)
```

The fix pattern: **read current state, check if terminal, return early if so.**

---

## Part 3: Timer Lifecycle — Understanding Bug #255

**Learning objective:** Trace the exact call chain of the double forfeit and identify which timer lifecycle step is missing.

### 3.1 A Timer Has Four Moments

```
1. Creation    — setTimeout(fn, delay) returns a handle
2. Storage     — handle saved somewhere accessible to cancellation
3. Fire/Cancel — either delay elapses and fn runs, OR clearTimeout cancels it
4. Cleanup     — stored reference is cleared
```

### 3.2 Trace the Double Forfeit (Issue #255)

Open the logs from the issue:

```
[Timer] Forfeit started for bbb in game 6 (30s remaining)
[Matchmaking] Auto-forfeiting stale game 6 for user 2
[Game Over] Game 6 forfeited. Winner: aaa
[Game Over] Game 6 forfeited. Winner: aaa     <-- THIS SHOULD NOT HAPPEN
```

**Your task:** Trace both paths through the code:

**Path A — The disconnect timer:**
1. Player bbb leaves game -> `leave_game_room` fires (`gameRoom.handlers.ts:~177`)
2. `startForfeitTimer()` called (`disconnection.service.ts:~25`) -> timer key: `"6-<bbbId>"`
3. Timer is ticking for 30 seconds...

**Path B — Matchmaking auto-forfeit:**
4. Player bbb clicks "Find Game" -> `find_game` fires (`matchmaking.handlers.ts:~19`)
5. Prisma finds game 6 still `IN_PROGRESS` (line ~19-28)
6. Player is NOT in game room (line ~31-32)
7. `handleForfeit()` is called directly (line ~57-67) -> game set to ABANDONED

**The bug:** After step 7, the timer from step 2 is still alive. Nobody called `cancelAllTimersForGame()`. When the 30 seconds elapse, `handleForfeit()` fires AGAIN.

### 3.3 Find the Missing Cancellation

**Your task:** Compare two places in the codebase:

1. `game.handlers.ts:~69` — what happens after a normal game over? Look for `cancelAllTimersForGame`.
2. `matchmaking.handlers.ts:~67` — what happens after the auto-forfeit? Is there a matching call?

The answer: `game.handlers.ts` correctly calls `disconnectionService.cancelAllTimersForGame()` after game over. `matchmaking.handlers.ts` does NOT. That is the missing step.

---

## Part 4: The "Both Disconnect" Edge Case — Issues #249 & #248

**Learning objective:** Explain why independent timers for the same game create conflicting outcomes and describe the detection problem for "abandoned."

### 4.1 What "Simultaneous" Means in Node.js

Two socket disconnects can't truly fire at the same instant (single-threaded event loop). But they fire in the same tick queue — meaning the second handler starts before any async I/O from the first completes.

Concretely:
1. Timer A fires -> reads game from DB (status = IN_PROGRESS)
2. Timer B fires -> reads game from DB (status = IN_PROGRESS, because A hasn't written yet)
3. Timer A writes: status = ABANDONED, winnerId = PlayerB
4. Timer B writes: status = ABANDONED, winnerId = PlayerA (OVERWRITE!)

### 4.2 Why They're Independent

`startForfeitTimer()` uses key format `"${gameId}-${userId}"`. Two players = two different keys:
- `"6-100"` (player A's timer, declares B as winner)
- `"6-200"` (player B's timer, declares A as winner)

Each timer callback only deletes its own key. Neither cancels the other.

### 4.3 The Detection Problem

To correctly set status = ABANDONED with no winner, the system needs to know BOTH players disconnected. But each timer callback only knows about ONE disconnection.

**Question to think through:** When the first timer fires, how can it check if the other player is also disconnected?

Hint: look at `io.in(\`user:${otherPlayerId}\`).fetchSockets()` — if that returns an empty array, the other player has no active socket connections.

---

## Part 5: Quiz — Gate Before Coding

Answer these before you open any file to edit. If you can't answer one, re-read the relevant section.

### Q1 — Idempotency

A teammate says: "I'll fix the double-forfeit by wrapping `handleForfeit` in a debounce with a 100ms window."

In 2-3 sentences: why is this wrong? What problem does it mask? What's the correct fix class?

<details>
<summary>Check your answer</summary>

Debouncing delays execution but doesn't prevent it — if the two calls are >100ms apart (which they will be: one is immediate, the other is 30s later), both still fire. It also masks the real bug: the function lacks an idempotency guard. The correct fix is a **terminal-state check** at the top of the function — read the game, return early if already ended.

</details>

### Q2 — Timer Lifecycle

```typescript
const timer = setTimeout(() => handleForfeit(gameId), 30_000);
// ... somewhere else:
socket.on("disconnect", () => {
  handleForfeit(gameId);  // direct call, bypasses timer
});
```

Name the missing step(s). What invariant does this code violate?

<details>
<summary>Check your answer</summary>

Missing step: after the direct `handleForfeit()` call, the existing timer is never cancelled (`clearTimeout(timer)` is never called). The invariant violated: "for a given game, at most one forfeit execution should complete." The fix: after any direct `handleForfeit()` call, cancel all timers for that game.

</details>

### Q3 — Both Disconnect

Handler A reads game status = `IN_PROGRESS`. Handler B reads game status = `IN_PROGRESS`. Handler A writes `ABANDONED, winner=B`. Handler B is about to write.

What should Handler B do? What does it need to read? Is read+write atomic in Prisma?

<details>
<summary>Check your answer</summary>

Handler B should re-read the game status. If it's already ABANDONED, it should be a no-op (the idempotency guard). Prisma's `findUnique` + `update` is NOT atomic — they're separate queries. However, in practice, the event loop processes timer callbacks sequentially. The first callback's `await prisma.game.update()` completes before the second callback starts its read, so the guard works. For extra safety, cancel sibling timers after each forfeit — this prevents the second callback from running at all.

</details>

---

## Part 6: Implementation Steps

Now that you understand the WHY, here's the WHAT. Three fixes, applied in order.

### Fix 1: Idempotency Guard in `handleForfeit()` (Defense-in-depth)

**File:** `backend/src/services/disconnection.service.ts`
**Where:** Inside `handleForfeit()`, at the very top of the `try` block (before `prisma.game.update`)

**What to add:** Before the existing `prisma.game.update()` call:
1. `findUnique` the game by ID, selecting only `status`
2. If game is null OR status is in `["ABANDONED", "FINISHED", "DRAW", "CANCELLED"]`, call `this.cancelAllTimersForGame(gameId)` and return
3. Otherwise, proceed with the existing update logic

**Why first:** This single guard prevents ALL three bugs. Even if timers aren't cancelled properly, the second call is a no-op.

### Fix 2: Cancel Sibling Timers After Forfeit Fires

**File:** `backend/src/services/disconnection.service.ts`
**Where:** Timer callback (line ~46-47) and immediate forfeit path (line ~39-42)

**What to change:** After `handleForfeit()` resolves, replace `this.forfeitTimers.delete(key)` with `this.cancelAllTimersForGame(gameId)`. This kills sibling timers too (e.g., the other player's timer for the same game).

**Why:** Prevents the second timer from even firing. Fix 1 is the safety net if this somehow misses.

### Fix 3: Cancel Timers in Matchmaking Auto-Forfeit

**File:** `backend/src/socket/handlers/matchmaking.handlers.ts`
**Where:** After the `handleForfeit()` call in the `find_game` handler (line ~67)

**What to add:** `disconnectionService.cancelAllTimersForGame(activeGame.id);`

**Why:** The matchmaking path calls `handleForfeit()` directly without going through the timer system. The existing disconnect timer doesn't know the game just ended.

### Fix 4: Handle "Both Players Disconnected" as Abandoned

**File:** `backend/src/services/disconnection.service.ts`
**Where:** Inside `handleForfeit()`, after the idempotency guard (Fix 1) but before the existing `prisma.game.update`

**What to add:**
1. Determine the other player's ID from the game record
2. Use `io.in(\`user:${otherPlayerId}\`).fetchSockets()` to check if they have active connections
3. If no active sockets (both players gone): update game with `status: "ABANDONED"`, `winnerId: null`, emit a `game_forfeited` event with an `abandoned: true` flag to both personal rooms, then cancel all timers and return
4. Otherwise: proceed with existing logic (one winner, one loser)

---

## Part 7: Verification Checklist

After implementing, test each scenario manually:

### Test 1 — Single Disconnect Forfeit (Baseline)
1. Start a game between Alice and Bob
2. Close Alice's browser tab
3. Wait 30 seconds
4. **Expected:** ONE "Game forfeited" log. Bob sees forfeit modal. Alice sees forfeit result on revisit.

### Test 2 — Matchmaking After Disconnect (Issue #255)
1. Start a game between Alice and Bob
2. Alice navigates away (leave_game_room fires)
3. Alice clicks "Find Game" (matchmaking auto-forfeit fires)
4. Wait 30 seconds (disconnect timer should NOT fire again)
5. **Expected:** ONE forfeit. Check backend logs for only one `[Game Over]` line.

### Test 3 — Both Disconnect (Issues #249, #248)
1. Start a game between Alice and Bob
2. Close BOTH browsers simultaneously
3. Wait 30 seconds
4. **Expected:** Game status = ABANDONED, winnerId = null. No conflicting winner events.

### Test 4 — Normal Game Over (Regression Check)
1. Play a game to completion (someone wins)
2. **Expected:** Normal game over. No forfeit logic fires. Winner correct.

---

## Part 8: Lint & PR

After all fixes pass testing:

```bash
cd backend && npm run lint
```

If lint passes, commit and create PR targeting `main`. PR title suggestion:
```
fix(game): add idempotency guard to handleForfeit and cancel sibling timers
```

Closes: #255, #249, #248

---

## Concepts You Learned

After completing Phase A, you should be able to explain:

1. **Idempotency guards** — why async state transitions must check current state before writing
2. **Timer lifecycle** — create, store, fire/cancel, cleanup — and what happens when you skip cleanup
3. **Terminal state checks** — using state machine invariants to prevent invalid transitions
4. **Race conditions in Node.js** — how the event loop processes quasi-simultaneous async callbacks
5. **Defense-in-depth** — why you want BOTH the guard (Fix 1) and the cancellation (Fixes 2-3)

---

## What's Next

After this PR is merged, this file will be updated with:
- **Phase B:** Reconnection State Restoration (Issues #254, #222, #221)
- **Phase C:** Avatar 404 Fix (Issues #251, #250)
- **Phase D:** Form Accessibility (Issues #253, #252)
