**Execution Order**
~~1. `#197`~~
~~2. `#203`~~
~~3. `#198`~~
~~4. `#202`~~
~~5. `#195`~~
~~6. `#196`~~
~~7. `#199`~~
~~8. `#200`~~
~~9. `#201`~~
~~10. `#168` (verification/closure)~~

**Post-Issue Regression**
~~11. Search avatar fallback (default avatar missing in user search)~~

**Final Hardening (PR #193)**
1. Validate `send_rematch` target (`newGameId`) belongs to the same participant pair as source game.
2. Keep non-participant rematch relay blocked server-side.
3. Add explicit positive socket relay test and mismatched-target rejection test.

**Global Validation Gate Before Marking PR #193 Ready**
1. Run frontend unit tests for changed areas.
2. Run backend socket/game tests including race and relay authorization checks.
3. Run lint/typecheck for frontend and backend.
4. Re-test two-browser rematch flow manually.
5. Ensure each issue has explicit closure evidence in issue/PR comments.
