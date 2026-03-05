**Execution Order**
~~1. `#197`~~
~~2. `#203`~~
~~3. `#198`~~
~~4. `#202`~~
5. `#195`
6. `#196`
7. `#199`
8. `#200`
9. `#201`
~~10. `#168` (verification/closure)~~


**#195 Rename `Symbol` Type**
1. Files to touch:
- [game.ts](/home/mgodawat/Documents/42/ft_transcendence/frontend/src/types/game.ts)
- [Game.tsx](/home/mgodawat/Documents/42/ft_transcendence/frontend/src/pages/Game.tsx)
- [Scoreboard.tsx](/home/mgodawat/Documents/42/ft_transcendence/frontend/src/components/Game/Scoreboard.tsx)
- [GameOverModal.tsx](/home/mgodawat/Documents/42/ft_transcendence/frontend/src/components/Game/GameOverModal.tsx)
2. Tests to add:
- No new behavior test required; run TS/lint plus affected unit tests.
3. Done criteria:
- No local alias named `Symbol` remains in game UI modules.
- Shared `PlayerSymbol` type is used consistently.

**#196 Centralize `PlayerSummary`**
1. Files to touch:
- [game.ts](/home/mgodawat/Documents/42/ft_transcendence/frontend/src/types/game.ts)
- [Game.tsx](/home/mgodawat/Documents/42/ft_transcendence/frontend/src/pages/Game.tsx)
- [Scoreboard.tsx](/home/mgodawat/Documents/42/ft_transcendence/frontend/src/components/Game/Scoreboard.tsx)
- [GameOverModal.tsx](/home/mgodawat/Documents/42/ft_transcendence/frontend/src/components/Game/GameOverModal.tsx)
2. Tests to add:
- Unit test covering shared player contract across room_joined + game_over mapping.
3. Done criteria:
- Single source of truth for player summary shapes.
- No duplicate conflicting interfaces.

**#199 Mirror Right Scoreboard Card**
1. Files to touch:
- [Scoreboard.tsx](/home/mgodawat/Documents/42/ft_transcendence/frontend/src/components/Game/Scoreboard.tsx)
- [Scoreboard.test.tsx](/home/mgodawat/Documents/42/ft_transcendence/frontend/tests/unit/Scoreboard.test.tsx)
2. Tests to add:
- Class/layout assertion for mirrored right card alignment.
3. Done criteria:
- Right card visually mirrored and readable on desktop/mobile.
- Existing active-player highlight still works.

**#200 Turn-Based Cell Hover Color**
1. Files to touch:
- [GameBoard.tsx](/home/mgodawat/Documents/42/ft_transcendence/frontend/src/components/Game/GameBoard.tsx)
- [game.ts](/home/mgodawat/Documents/42/ft_transcendence/frontend/src/types/game.ts)
- [Game.tsx](/home/mgodawat/Documents/42/ft_transcendence/frontend/src/pages/Game.tsx)
- [GameBoard.test.tsx](/home/mgodawat/Documents/42/ft_transcendence/frontend/tests/unit/GameBoard.test.tsx)
2. Tests to add:
- Unit test: empty cell hover class differs for X turn vs O turn.
3. Done criteria:
- Hover cue maps to current player.
- Disabled/not-your-turn states do not show actionable hover.

**#201 Winner Highlight Readability**
1. Files to touch:
- [index.css](/home/mgodawat/Documents/42/ft_transcendence/frontend/src/index.css)
- [GameBoard.tsx](/home/mgodawat/Documents/42/ft_transcendence/frontend/src/components/Game/GameBoard.tsx) (only if class mapping changes)
- [GameBoard.test.tsx](/home/mgodawat/Documents/42/ft_transcendence/frontend/tests/unit/GameBoard.test.tsx)
2. Tests to add:
- Keep class-based tests; add assertion if class names or mapping change.
3. Done criteria:
- Winner line visually distinguishable with acceptable contrast.
- Loss highlight semantics unchanged.

**#168 Verify-And-Close Task**
1. Files to touch:
- No runtime file required unless mismatch found.
- Optional report file: [bugfixes.md](/home/mgodawat/Documents/42/ft_transcendence/doc/reports/bugfixes.md)
2. Tests to add:
- None required if current behavior already satisfies issue.
3. Done criteria:
- Manual verification checklist completed against live UI.
- Comment posted with proof (screenshots/test refs).
- Issue closed or rewritten if remaining scope is different.

**Global Validation Gate Before Marking PR #193 Ready**
1. Run frontend unit tests for changed areas.
2. Run backend socket/game tests including new race tests.
3. Run lint/typecheck for frontend and backend.
4. Re-test two-browser rematch flow manually.
5. Ensure each issue has explicit “Fixes #…” mapping in commits/PR notes.

If you want, next I’ll turn this into a day plan with exact command sequence and per-issue timebox (still no coding).

### New Bug
When searching for a profile. The default avatar doesnt show up. Only when a new avatar is updated it shows up in the search.
