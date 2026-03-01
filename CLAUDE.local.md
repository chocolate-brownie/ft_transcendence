# Local Session Notes (Do Not Commit)

## Last Reviewed PR
- PR: #119
- Commit reviewed: d37dcc9ba1d2d2d60f215ee9c99845c511bb9d5c
- Review worktree: /tmp/pr-119-review

## Validation Snapshot
- Frontend lint: pass
- Backend lint: pass
- Backend tests: failing suites:
  - tests/auth.me.test.ts (expects 200/404, receives 500)
  - tests/history.chat.test.ts (cannot find module socket.io-client)
  - tests/chat.send-message.test.ts (cannot find module socket.io-client)

## Durable Pitfalls Observed
- Avoid mutating outer variables inside React setState updaters for control flow; keep updater functions pure.
- For chat/thread pagination, prepend operations need explicit scroll-anchor restoration to avoid jump-to-bottom UX regressions.

## Handy Commands
- Update PR review worktree to exact commit:
  - git -C /tmp/pr-119-review reset --hard <commit_sha>
- Run checks in review worktree:
  - cd /tmp/pr-119-review/frontend && npm run lint
  - cd /tmp/pr-119-review/backend && npm run lint
  - cd /tmp/pr-119-review/backend && npm test -- --runInBand
