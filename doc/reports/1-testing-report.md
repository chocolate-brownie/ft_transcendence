# Phase 2 Testing Report

**Tested by:** mgodawat
**Date:** 2026-02-23
**Branch:** `testings/27-phase-2-test-protected-routes`

---

## Summary

| Category               | Count |
|------------------------|-------|
| Total test cases       | 70    |
| Passed                 | 70    |
| Failed                 | 0     |
| Bugs found             | 0     |
| Critical bugs          | 0     |
| Major bugs             | 0     |
| Minor bugs             | 0     |

---

## Test Results

### Signup Flow (Issue #25 — manual + no dedicated test file)

Tested manually via the signup page and `POST /api/auth/signup`.

- [x] Valid input → PASS
- [x] Duplicate email → PASS (409 Conflict)
- [x] Duplicate username → PASS (409 Conflict)
- [x] Empty fields → PASS (400 Bad Request)
- [x] Invalid email format → PASS (400 Bad Request)
- [x] Password too short (< 8 chars) → PASS (400 Bad Request)
- [x] Username too short (< 3 chars) → PASS (400 Bad Request)
- [x] Token stored in localStorage after signup → PASS
- [x] `passwordHash` never exposed in response → PASS

> Note: No automated tests were written for the signup flow in this cycle.
> The PR (#73) fixed bugs in the signup service and frontend form, but did
> not include a test file. Automated signup tests should be added in a
> follow-up issue.

---

### Login Flow (Issue #26 — `backend/tests/auth.login.test.ts` + `frontend/tests/e2e/login.spec.ts`)

#### Backend — `POST /api/auth/login` (13 unit tests, all pass)

- [x] Valid credentials → 200 + JWT token → PASS
- [x] Returns correct user fields (no `passwordHash`) → PASS
- [x] Sets `isOnline = true` in DB on login → PASS
- [x] New JWT issued on second login → PASS
- [x] Wrong password → 401 "Invalid email or password" → PASS
- [x] Non-existent email → 401 "Invalid email or password" → PASS
- [x] Error message is identical for wrong password vs unknown email (no user enumeration) → PASS
- [x] Missing both fields → 400 → PASS
- [x] Missing email → 400 → PASS
- [x] Missing password → 400 → PASS
- [x] Both fields empty strings → 400 → PASS
- [x] Email case-insensitivity → PASS (documents actual behaviour)
- [x] Leading/trailing whitespace in email → PASS (documents actual behaviour)

#### Frontend E2E — Login page `/login` (14 tests, all pass)

- [x] Valid credentials → redirects to `/` → PASS
- [x] JWT stored in `localStorage` after login → PASS
- [x] New JWT replaces old JWT on second login → PASS
- [x] Wrong password → shows error message → PASS
- [x] Non-existent email → shows error message → PASS
- [x] Error message is the same for both wrong cases → PASS
- [x] Empty email → shows validation error → PASS
- [x] Empty password → shows validation error → PASS
- [x] Invalid email format → shows "Invalid email" error → PASS
- [x] Both fields empty → shows validation error → PASS
- [x] Session survives page refresh → PASS
- [x] Manual `localStorage` deletion → redirects to `/login` on protected route → PASS
- [x] Visiting `/login` while authenticated shows login form (no double-redirect) → PASS
- [x] Submit button shows loading state and is disabled during request → PASS

---

### Protected Routes (Issue #27 — `backend/tests/auth.me.test.ts` + `frontend/tests/e2e/protected-routes.spec.ts`)

#### Backend — `GET /api/auth/me` (14 unit tests, all pass)

- [x] Valid token → 200 + user data → PASS
- [x] Returns correct user fields (no `passwordHash`) → PASS
- [x] Queries DB by userId from JWT (not stale payload) → PASS
- [x] No Authorization header → 401 → PASS
- [x] No token — DB is not called → PASS
- [x] Tampered token (one char changed) → 401 → PASS
- [x] Completely fake token string → 401 → PASS
- [x] Token signed with wrong secret → 401 → PASS
- [x] Missing `Bearer ` prefix → 401 → PASS
- [x] Invalid token — DB is not called → PASS
- [x] Already-expired token → 401 → PASS
- [x] Expired token error message matches `/expired/i` → PASS
- [x] User deleted after token was issued → 404 → PASS
- [x] Database throws → 500 → PASS

#### Frontend E2E — Protected route access control (15 tests, all pass)

- [x] Logged in → can access `/profile` → PASS
- [x] Logged in → can access `/game` → PASS
- [x] Profile page renders user data from `GET /api/auth/me` → PASS
- [x] Not logged in → `/profile` redirects to `/login` → PASS
- [x] Not logged in → `/game` redirects to `/login` → PASS
- [x] Not logged in → `/profile/:id` redirects to `/login` → PASS
- [x] Not logged in → `/game/:id` redirects to `/login` → PASS
- [x] Token manually removed → redirect to `/login` → PASS
- [x] `localStorage.clear()` → redirect to `/login` → PASS
- [x] Tampered token → redirect to `/login` → PASS
- [x] Random string as token → redirect to `/login` → PASS
- [x] Invalid token cleared from `localStorage` after rejection → PASS
- [x] Session survives page reload on `/profile` → PASS
- [x] Can navigate between `/profile` and `/game` while logged in → PASS
- [x] Token removed mid-session → next navigation redirects to `/login` → PASS

---

## Critical Bugs

_None found._

---

## Major Bugs

_None found._

---

## Minor Issues

_None found._

---

## Test Infrastructure Notes

- **Backend tests** use Jest + Supertest with Prisma fully mocked — no real DB required.
- **Frontend E2E tests** use Playwright against the live Docker stack (`transcendence-backend`, `transcendence-db`, `transcendence-frontend` must be running).
- The E2E test user `e2e_login_test@example.com` / `E2eTestPass1x` must exist in the DB before running Playwright tests. Create it once with:
  ```bash
  curl -sk -X POST https://localhost:3000/api/auth/signup \
    -H "Content-Type: application/json" \
    -d '{"email":"e2e_login_test@example.com","username":"e2e_tester","password":"E2eTestPass1x"}'
  ```
- Run backend tests: `npm test` (from `backend/`)
- Run frontend E2E tests: `npm run test:e2e` (from `frontend/`)

---

## Retest Log

| Date       | Scope              | Result    | Notes                          |
|------------|--------------------|-----------|--------------------------------|
| 2026-02-23 | All (Issues #26, #27) | 56/56 ✓ | First automated test run       |
