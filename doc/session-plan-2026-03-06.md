# Session Plan — 2026-03-06

## PR #235 Review + Sub-Issues + Pre-Phase-5 Cleanup

---

## 0. Context

- **Branch:** `fix/Test-MatchMaking`
- **PR #235** claims to close: #152 (parent), #224, #225, #226
- **Parent issue #152** spawned 9 sub-issues (#223–#231) from two-browser testing
- **Overall pass rate** from test report: 80% (12/15 test cases)

---

## Part 1 — PR #235: Bring to Mergeable State

### 1.1 What the PR Actually Fixed (already done)

- [x] **#224** — Duplicate `join`/`leave` + duplicate room events on match start
  - Approach: `receivedEventsRef` deduplication + module-level `joinState` object to survive React StrictMode double-mount
- [x] **#225** — "Play Again" started a new game instead of returning to lobby
  - Approach: `handlePlayAgain` now calls `emitLeaveRoomOnce()` then navigates to `/matchmaking`
- [x] **#226** — Opening/closing a second tab triggered disconnect on the active game tab
  - Approach: `disconnection.handlers.ts` now fetches all active sockets for the user and skips game disconnection if other sockets exist
- [x] New `matchmaking.service.ts` — extracted matchmaking logic into a proper singleton service class (good separation of concerns)

### 1.2 Issues in the PR That Must Be Fixed Before Merge

> These are **blocking**. Do not merge until these are resolved.

- [x] **Remove debug `console.log` statements** from `useGameSocketController.ts`
  - `[DEBUG] Emitting leave_game_room for game X`
  - `[DEBUG] Game component unmounting, calling emitLeaveRoomOnce`
  - Also: `matchmaking.service.ts` has `console.log` on every queue operation — remove or replace with a proper logger flag
  - **File:** `frontend/src/pages/game/useGameSocketController.ts`, `backend/src/services/matchmaking.service.ts`

- [x] **Remove dead commented-out code** in `Game.tsx`
  - The old `handlePlayAgain` async function is kept as a `/* ... */` block comment
  - It even has a comment `// Old version, createNewgame` above it — just delete it
  - **File:** `frontend/src/pages/Game.tsx`

- [x] **Fix indentation regression** in `gameRoom.handlers.ts`
  - ~~The `leave_game_room` handler body lost one indentation level vs the rest of the file~~ — **NOT AN ISSUE**
  - Verified against the actual committed file: `try {` is at 4 spaces (correct for the inline `socket.on` form). The PR diff display was misleading. No fix needed.

- [x] **Run `npm run lint`** in both `backend/` and `frontend/` after changes and confirm 0 errors

### 1.3 Architectural Concern (Non-blocking, but should be noted in PR)

- [x] **Module-level mutable state (`joinState`)** — flag this in PR review
  - `joinState` is a module-level object that persists between component mounts. This was intentionally chosen to survive React StrictMode's double-invocation of effects.
  - **Risk:** If the user navigates away and back to a different game, `pendingGameId`/`joinedGameId` could be stale and block the new join.
  - **Mitigation already present:** The `joinRevision` and `gameId` change effects do reset `joinState`. This is acceptable for Phase 4 but should be refactored in Phase 5.
  - **Action for now:** Add a code comment explaining WHY this is module-level, so teammates don't remove it thinking it's a mistake.

### 1.4 Issue #223 — NOT Addressed in this PR

**Decision needed:** Should #223 (cancel search double emit) be fixed in this same branch or a new branch?

**Analysis:**

- Root cause: `Matchmaking.tsx` has a `useEffect` cleanup that emits `cancel_search` when `status === "searching"`. When `leaveMatchmaking()` is called, it emits `cancel_search` manually AND the cleanup fires a second time.
- The fix is small (1-2 lines: a ref guard in Matchmaking.tsx).
- **Recommendation: Fix it in this same branch** — it is directly related to the matchmaking flow this PR is already touching, it's small, and it avoids creating a 1-line PR just for a minor guard.

- [x] **Fix #223** in this branch: add a `cancelledRef` to `Matchmaking.tsx` so `cancel_search` is only emitted once

---

## Part 2 — Open Sub-Issues: Priority Stack

Ordered from **highest to lowest priority** for the next sessions.

### Priority 1 — CRITICAL (blocks core gameplay)

| Issue    | Title                                                      | Impact                           | Branch strategy                                   |
| -------- | ---------------------------------------------------------- | -------------------------------- | ------------------------------------------------- |
| **#227** | Leaving game via Home locks player in "already in a game"  | Major — player can't queue again | New branch: `fix/issue-227-navigate-home-cleanup` |
| **#228** | Forfeit + refresh → both players stuck with disabled board | Major — game loop broken         | New branch: `fix/issue-228-forfeit-refresh-state` |

**Why new branches?** These touch game forfeiture logic, server-side game state, and reconnection — deeper backend changes that should be reviewed independently from the matchmaking PR.

### Priority 2 — MINOR UI (clean but not blocking)

| Issue    | Title                                            | Impact   | Branch strategy                          |
| -------- | ------------------------------------------------ | -------- | ---------------------------------------- |
| **#230** | Simplify Game Over modal (remove "Back to Home") | Minor UX | Can bundle with #229                     |
| **#229** | Color-code turn indicator by X/O                 | Minor UX | Bundle with #230 in `fix/game-ui-polish` |

### Priority 3 — DISCUSSION (needs team alignment)

| Issue    | Title                                | Notes                                                                                                                                             |
| -------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **#231** | In-game scoreboard resets every game | The scoreboard is misleading as-is. Three options: (a) remove it, (b) make it session-persistent, (c) wire it to DB stats. Discuss before coding. |

---

## Part 3 — Pre-Phase-5 Codebase Cleanup ("AI Slop")

> No new features until this is addressed. This is technical debt that will slow Phase 5.

### 3.1 Files Exceeding 200 Lines (Current State)

**Frontend** (most critical first):

| File                                    | Lines   | Problem                                                                          | Action                                                                  |
| --------------------------------------- | ------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `pages/Profile.tsx`                     | **615** | God component — profile display + edit + avatar upload + friend logic all in one | Split into `ProfileView.tsx`, `ProfileEditForm.tsx`, `AvatarUpload.tsx` |
| `components/Tournament/BracketView.tsx` | 358     | Visual + logic mixed                                                             | Extract bracket logic to a hook                                         |
| `pages/game/useGameSocketController.ts` | **355** | Socket controller is already a separate hook, but too long                       | Extract event handler groups into smaller named functions               |
| `pages/Game.tsx`                        | 349     | Page + render + handlers all mixed                                               | Extract `GameBoard` render section, move handlers to hook               |
| `pages/game/state.ts`                   | 320     | Reducer + types + initial state                                                  | Split types and initial state                                           |
| `components/Navbar.tsx`                 | 298     | Too many concerns                                                                | Extract mobile menu, notification dropdown                              |
| `components/Chat/MessageThread.tsx`     | 292     | Fetch + socket + render                                                          | Extract fetch logic to hook                                             |
| `pages/Matchmaking.tsx`                 | 237     | Manageable — lower priority                                                      | Can defer                                                               |

**Backend** (most critical first):

| File                                   | Lines   | Problem                                        | Action                                                                        |
| -------------------------------------- | ------- | ---------------------------------------------- | ----------------------------------------------------------------------------- |
| `services/games.service.ts`            | **523** | Massive service with too many responsibilities | Split: `game-state.service.ts`, `game-moves.service.ts`, `game-ai.service.ts` |
| `socket/handlers/gameRoom.handlers.ts` | 354     | Already borderline after PR changes            | Extract helper functions                                                      |
| `services/friends.service.ts`          | 343     | OK for now — lower priority                    | Defer                                                                         |
| `services/chat.service.ts`             | 314     | OK for now                                     | Defer                                                                         |
| `services/tournaments.service.ts`      | 306     | OK for now                                     | Defer                                                                         |
| `controllers/friends.controller.ts`    | 243     | Controller is too fat                          | Move logic down to service                                                    |

### 3.2 Other Code Quality Issues Found

- [ ] **Stale `console.log` statements throughout the codebase** — run a grep pass and remove all non-intentional logs before Phase 5
- [ ] **Mixed comment languages** — French comments found in multiple backend files (pre-existing, not just this PR)
- [ ] **Unused variables/imports** — lint will catch these; run `npm run lint` and fix all warnings
- [ ] **Commented-out dead code blocks** — found in `Game.tsx` and likely elsewhere; grep for `/* ` and `//` blocks that are clearly dead

### 3.3 Cleanup Session Strategy

**Do NOT do this all at once.** Refactoring large files without tests is risky. Recommended approach:

1. **First pass (safe):** Remove console.logs, fix comment language, delete dead code. No logic changes. Can be done in one branch: `chore/pre-phase5-cleanup`.
2. **Second pass (structural):** Split `Profile.tsx` and `games.service.ts` as priority. One PR per file.
3. **Do not split files that are about to be heavily modified in Phase 5** — splitting and then immediately adding Phase 5 features doubles the diff noise.

---

## Part 4 — GitHub Workflow: File Size Enforcement

### Can We Enforce 150/200 Line Limit via GitHub Actions?

**Short answer: Yes, but with caveats.**

GitHub Actions has no native "file size" rule, but a custom workflow can check this on every PR.

### Proposed Workflow Behavior

```
On pull_request → get changed files → for each .ts/.tsx file changed:
  - WARN at > 150 lines
  - FAIL at > 200 lines
```

### Practical Problem: Existing Files

The codebase already has **multiple files over 200 lines** (Profile.tsx = 615 lines). If we enforce this strictly today, every PR that touches Profile.tsx will fail CI — even a 1-line bugfix.

**Recommendation:** Two-phase rollout:

**Phase A (now):** Implement workflow with `--warn-only` mode — it reports violations as a comment on the PR but does NOT fail the build. This creates visibility without blocking work.

**Phase B (after cleanup):** Once the known large files are split (Part 3.2), switch to fail mode and set it as a required check.

### Implementation Plan

- [ ] Create `.github/workflows/file-size-check.yml`
- [ ] Script logic:
  - Get list of changed `.ts` and `.tsx` files in the PR
  - For each, count lines with `wc -l`
  - Post a summary annotation (GitHub annotations API or step summary)
  - Initially: `exit 0` (warn-only); switch to `exit 1` after cleanup
- [ ] Add comment to workflow explaining the two-phase rollout plan

---

## Part 5 — `doc/tasks.md` Update

The tasks.md is out of date. Phase 4 items that are done need to be checked off, and Phase 5 items need re-evaluation.

- [ ] Update Phase 4 checkboxes to reflect current state:
  - `[ ] Matchmaking: find_game event...` → mark complete
  - `[ ] Cancel matchmaking: cancel_search event` → mark complete (after #223 fix)
  - `[ ] make_move / game_update / game_over events` → mark complete
  - `[ ] Game states: waiting, playing, finished` → review actual state
  - `[ ] Disconnection handling (30s forfeit)` → partially done; #227 and #228 still open
  - `[ ] Reconnection` → still open
- [ ] Add Phase 5 section with module breakdown and owner assignments
- [ ] Cross-reference sub-issues #223–#231 in the relevant task entries

---

## Execution Order Summary

```
Session 1 (current): Research + planning ONLY (this document)

Session 2: Bring PR #235 to mergeable state
  1. Fix console.logs (both files)
  2. Remove dead commented code (Game.tsx)
  3. Fix French comments → English
  4. Fix indentation (gameRoom.handlers.ts)
  5. Fix #223 (cancel_search double emit, Matchmaking.tsx)
  6. Run lint (frontend + backend)
  7. Push → PR #235 ready for merge

Session 3: Fix #227 (navigate home game lock)
  - New branch: fix/issue-227-navigate-home-cleanup

Session 4: Fix #228 (forfeit + refresh stuck state)
  - New branch: fix/issue-228-forfeit-refresh-state

Session 5: UI polish + #231 decision
  - Bundle #229 + #230 in fix/game-ui-polish
  - Team discussion on #231 (scoreboard — remove vs keep)

Session 6: Pre-Phase-5 cleanup
  - Branch: chore/pre-phase5-cleanup
  - Remove all console.logs, fix comments, remove dead code
  - Split Profile.tsx and games.service.ts

Session 7: GitHub Actions file size workflow
  - Branch: chore/file-size-ci
  - Warn-only mode first

Session 8: Update doc/tasks.md
  - Check off completed Phase 4 items
  - Plan Phase 5 ownership
```

---

## Open Questions (Needs Team Input)

1. **#231 Scoreboard:** Remove entirely vs persist session score vs wire to DB stats?
2. **Reconnection (#154):** Is this in scope before evaluation, or defer to Phase 5?
3. **File size enforcement:** Hard fail at 200 or warn-only to start?
4. **Language standard:** Enforce English-only comments via ESLint rule (`eslint-plugin-comments`)?
