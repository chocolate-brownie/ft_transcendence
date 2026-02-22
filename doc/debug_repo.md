# Bug Report: `bcrypt` Native Addon Incompatibility with Alpine Linux

## Summary

The `POST /api/auth/signup` endpoint was returning `500 Internal Server Error`
and crashing the entire backend process. The root cause was a native C++ addon
incompatibility between the `bcrypt` npm package and the Alpine Linux base image
used in Docker.

---

## What Happened

When a user submitted the signup form, the backend would:

1. Receive the request
2. Validate input
3. Check for duplicate email/username in the database
4. **Hang indefinitely at `bcrypt.hash(password, saltRounds)`**
5. Never respond — the request timed out, the frontend received a `500`, and
   the Node.js process crashed entirely

After the crash, the backend was unresponsive until the container was restarted.

---

## Root Cause

`bcrypt` is a native Node.js addon — it includes C++ code that is compiled
during `npm install` against the system's C standard library (`libc`).

| Environment        | C Library | Compatible with `bcrypt`? |
| :----------------- | :-------- | :------------------------ |
| Ubuntu / Debian    | glibc     | ✅ Yes                    |
| macOS              | libSystem | ✅ Yes                    |
| Alpine Linux       | musl libc | ❌ No                     |

Our Docker image (`node:22-alpine`) uses Alpine Linux, which uses **musl libc**
instead of glibc. The `bcrypt` native addon was compiled expecting glibc symbols
that do not exist in musl — causing the process to hang or segfault silently
when `bcrypt.hash()` was called.

**No JavaScript error was thrown.** The process simply stalled, which made this
extremely difficult to diagnose without step-by-step checkpoint logging.

---

## Why It Was Hard to Diagnose

Several factors masked the real cause:

- **`tsx --watch` hot-reload loop**: File edits caused tsx to try restarting the
  process, but the hung bcrypt thread prevented clean shutdown — leaving the
  backend stuck in a kill/restart loop.
- **Vite proxy 500**: When the backend was down, Vite's HTTP proxy returned its
  own `text/plain` 500 response (with CORS headers, since Vite adds them too),
  making it look like an Express error.
- **No error output**: musl/glibc incompatibility causes a silent hang — no
  exception, no stack trace, no crash message in logs.
- **Node.js 22 crash behavior**: Unhandled Promise rejections crash the process
  by default in Node.js 22, wiping any context about what caused the failure.

---

## How We Diagnosed It

1. Added `process.on('unhandledRejection')` to prevent silent crashes and log
   the reason.
2. Added a global Express error handler `(err, req, res, next)` to catch
   unhandled async errors.
3. Added step-by-step checkpoint logs to `auth.service.ts`:
   ```
   [signup] 1 — validating input
   [signup] 2 — checking existing users in DB
   [signup] 3 — hashing password       ← execution stopped here
   [signup] 4 — creating user in DB
   [signup] 5 — done
   ```
4. Logs confirmed the process stopped **exactly at step 3** — the `bcrypt.hash()`
   call — with no further output and no error.

---

## Fix Applied

Replaced `bcrypt` with `bcryptjs` — a pure JavaScript implementation of the
bcrypt algorithm that has zero native dependencies and works on any platform.

**`backend/package.json`**
```diff
- "bcrypt": "^5.1.1"
+ "bcryptjs": "^2.4.3"

- "@types/bcrypt": "^5.0.2"
+ "@types/bcryptjs": "^2.4.6"
```

**`backend/src/services/auth.service.ts`**
```diff
- import bcrypt from "bcrypt";
+ import bcrypt from "bcryptjs";
```

Then ran `make re` to rebuild the Docker image so the new package was installed
inside the container.

The API is a drop-in replacement — no other code changes were needed.

---

## What Could Have Prevented This

### 1. Use `bcryptjs` from the start
`bcryptjs` is the Alpine-safe alternative. It is slightly slower than the native
`bcrypt` for very high loads, but for a web app doing one hash per login/signup
the difference is imperceptible.

**Rule of thumb:** If your Docker image uses `*-alpine`, avoid native addons.

### 2. Check your base image before choosing packages
Before installing any npm package that has a native addon, verify it supports
musl libc. Common problem packages on Alpine:
- `bcrypt` → use `bcryptjs`
- `sharp` → use `--platform linux/amd64` or the `sharp` prebuilt Alpine build
- `node-gyp`-based packages in general → check for a pure-JS alternative

### 3. Add a smoke test in CI/CD
A simple integration test that calls `POST /api/auth/signup` would have caught
this immediately after the Docker image was built, before it ever reached a
developer's machine.

### 4. Add defensive error handling early
The `process.on('unhandledRejection')` handler and the global Express error
handler `(err, req, res, next)` should be standard boilerplate in any Express
app. They were added during debugging but should have been there from day one.

---

## Outcome

- Signup and login are fully functional.
- Passwords are correctly hashed with bcryptjs (`$2a$12$...` format).
- Two users confirmed in the database post-fix.
- Debug checkpoint logs removed after verification.
