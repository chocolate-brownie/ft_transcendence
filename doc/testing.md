# Testing Guide — ft_transcendence

This project has two layers of automated tests. Both replace the need to manually click through the browser or fire requests in Postman every time you make a change.

---

## Overview

| Layer | Tool | Location | Needs Docker? |
|---|---|---|---|
| Backend API tests | Jest + Supertest | `backend/tests/` | No |
| Frontend E2E tests | Playwright | `frontend/tests/e2e/` | Yes |

---

## Part A — Backend API Tests (Jest + Supertest)

These tests hit the Express routes directly, with Prisma fully mocked. No database or Docker required.

### Run

```bash
cd backend
npm test
```

### What they cover (login flow, `backend/tests/auth.login.test.ts`)

- Valid credentials → 200 + JWT returned
- `passwordHash` never exposed in the response
- `isOnline` set to `true` in DB on login
- JWT is replaced on a second login
- Wrong password → 401 with generic message
- Non-existent email → 401 with the **same** generic message (no user enumeration)
- Empty email / empty password / both empty → 400
- Edge cases: email case sensitivity, leading/trailing whitespace

### Expected output

```
PASS tests/auth.login.test.ts
  POST /api/auth/login
    Valid credentials (happy path)
      ✓ returns 200 with a JWT token and user object
      ✓ returns the correct user fields (no passwordHash)
      ...
Tests: 13 passed
```

---

## Part B — Frontend E2E Tests (Playwright)

These tests open a real (headless) browser, navigate to pages, fill in forms, and check what appears on screen — exactly what you'd do manually.

### Prerequisites

1. The full Docker stack must be running:
   ```bash
   # from project root
   make up
   ```

2. A test account must exist in the database (see below).

### The test account

The E2E tests log in as:
- **Email:** `e2e_login_test@example.com`
- **Password:** `E2eTestPass1x`

This account needs to be created once per database. If you wipe the DB (e.g. `make fclean` + fresh volumes), re-create it:

```bash
curl -s -k -X POST https://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  --data-raw '{"email":"e2e_login_test@example.com","username":"e2e_tester","password":"E2eTestPass1x"}'
```

> **Note:** Do not use `!` in the password when creating it via curl in zsh — the shell eats it. That's why the password ends in `x`.

### Run

```bash
cd frontend
npm run test:e2e
```

### What they cover (login flow, `frontend/tests/e2e/login.spec.ts`)

- Redirect to `/` after successful login
- JWT stored in `localStorage["token"]` after login
- JWT replaced in localStorage on a second login
- Wrong password → error banner shown, no redirect
- Non-existent email → same error banner (no user enumeration)
- Both error messages are identical (explicit check)
- Client-side validation: empty email, empty password, both empty, invalid email format
- Session survives a page refresh
- Deleting the token from localStorage manually → protected route redirects to `/login`
- Visiting `/login` while already authenticated

### Expected output

```
Running 13 tests using 1 worker

  ✓  redirects to home page after successful login
  ✓  stores JWT in localStorage after login
  ...

13 passed (16s)
```

---

## Adding tests for a new feature

When you implement a new backend endpoint or frontend page, follow this pattern:

**Backend:** Create `backend/tests/<feature>.test.ts`
- Mock Prisma with `jest.unstable_mockModule`
- Import `app` from `../src/index.js` after setting up mocks
- Use `supertest` to fire HTTP requests and assert responses

**Frontend:** Create `frontend/tests/e2e/<feature>.spec.ts`
- Use `page.goto()`, `page.locator()`, `page.fill()`, `expect()` from `@playwright/test`
- Start from a clean state with `localStorage.clear()` in `beforeEach`

---

## Troubleshooting

**`EADDRINUSE: address already in use`**
The backend server is running and Jest tried to start another one. This is already handled — `NODE_ENV=test` prevents the server from binding a port during tests. If you still see this, check that `tests/setup.ts` is setting `NODE_ENV=test`.

**E2E: `401 Invalid credentials`**
The test account doesn't exist in the database. Re-run the `curl` command above to create it.

**E2E: `net::ERR_CONNECTION_REFUSED`**
Docker is not running. Run `make up` from the project root.

**E2E: `Timeout waiting for selector`**
A UI element wasn't found in time. The selector in the test may be stale if the component's HTML changed. Check the relevant test file and update the locator to match the current markup.
