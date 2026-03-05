**Execution Order**
~~1. `#197`~~
~~2. `#203`~~
~~3. `#198`~~
~~4. `#202`~~
~~5. `#195`~~
~~6. `#196`~~
~~7. `#199`~~
~~8. `#200`~~
9.`#201`
~~10. `#168` (verification/closure)~~

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

**Global Validation Gate Before Marking PR #193 Ready**

1. Run frontend unit tests for changed areas.
2. Run backend socket/game tests including new race tests.
3. Run lint/typecheck for frontend and backend.
4. Re-test two-browser rematch flow manually.
5. Ensure each issue has explicit “Fixes #…” mapping in commits/PR notes.

If you want, next I’ll turn this into a day plan with exact command sequence and per-issue timebox (still no coding).

### New Bug

When searching for a profile. The default avatar doesnt show up. Only when a new avatar is updated it shows up in the search.
