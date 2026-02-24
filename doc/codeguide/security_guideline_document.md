# Security Guidelines for ft_transcendence

This document describes the security principles, controls, and best practices to embed throughout the lifecycle of the ft_transcendence application. Each section maps to a core security domain and provides actionable recommendations tailored to the technologies used (Express, Prisma, PostgreSQL, Socket.io, React, Docker, JWT, bcrypt).

---

## 1. Security by Design & Secure Defaults

- Treat security as a first-class requirement: integrate these guidelines into design, development, and testing.  
- Configure all components with the most restrictive settings by default (“secure by default”).  
- Enforce the principle of least privilege for services, database users, and file permissions.  
- Layer defenses (defense in depth) so that failure of one control does not compromise the system.

---

## 2. Authentication & Access Control

### 2.1 Robust Authentication
- Use bcrypt (or Argon2) with a unique salt per password; set cost factors high enough to slow brute-force (bcrypt saltRounds ≥ 12).  
- Reject weak passwords via server-side validation: enforce minimum length (≥ 10 characters), complexity (uppercase, lowercase, digit, symbol), and check against common blacklists.  
- Store no plain-text secrets in code or config; load JWT signing keys from a secrets manager or encrypted environment variables.

### 2.2 JSON Web Tokens (JWT)
- Enforce a single strong algorithm (e.g., RS256 or ES256). Do **not** accept the `none` algorithm or dynamically provided `alg` headers.  
- Use asymmetric signing (RS256) if services verify tokens; protect private keys in vaults, expose public keys via JWKS endpoint.  
- Validate all standard claims (`exp`, `iat`, `iss`, `aud`) and reject tampered or expired tokens.  
- Implement key rotation via `kid` header; retire old tokens gracefully.  
- Store access tokens in **HttpOnly**, **Secure**, **SameSite=Strict** cookies; consider the Backend-for-Frontend (BFF) pattern to avoid exposing tokens to JavaScript.  
- Issue short-lived access tokens (5–15 minutes) and longer refresh tokens; maintain a revocation list or store refresh tokens securely to support logout and compromise recovery.

### 2.3 Session & WebSocket Handshake Security
- Authenticate Socket.io connections in `io.use()` middleware by verifying JWT before upgrading.  
- Reject unauthorized or malformed handshake requests immediately to conserve resources.  
- Enforce an idle timeout and absolute session timeout; force re-authentication after a predefined window.  
- Provide an explicit logout endpoint that invalidates both REST sessions and active WebSocket connections.

### 2.4 Role-Based Access Control (RBAC)
- Define minimal roles and permissions (e.g., `player`, `tournament-organizer`, `admin`).  
- Perform server-side authorization checks on every protected API and action event.  
- Never rely solely on client-side guards; verify user roles in Express middleware and WebSocket event handlers.

---

## 3. Input Handling & Data Validation

- Treat **all** inputs (HTTP bodies, query strings, URL parameters, WebSocket payloads, file uploads) as untrusted.  
- Apply strict schema validation (e.g., using `zod` or `Joi`) on the server for every endpoint and event.  
- Use Prisma’s parameterized queries and ORM methods to avoid SQL injection; never assemble SQL strings by concatenation.  
- Sanitize or escape user-supplied content displayed in the UI (e.g., chat messages) to prevent XSS.  
- Enforce a maximum payload size for Socket.io (set `maxHttpBufferSize` to a safe limit).  
- For avatar uploads:
  - Validate MIME type and file extension.  
  - Scan for malware.  
  - Store files outside the webroot or serve via a signed URL.  
  - Enforce size limits and strip metadata.

---

## 4. Data Protection & Privacy

- Encrypt all traffic in transit with TLS 1.2+ (HTTPS/WSS).  
- Encrypt sensitive data at rest (database encryption, disk encryption for containers).  
- Ensure database connections use SSL mode and verify server certificates.  
- Do not log sensitive information (passwords, tokens, PII). Mask or redact in logs.  
- Enforce GDPR/CCPA data deletion workflows: remove or anonymize personal data upon user request.

---

## 5. API & Service Security

- Enforce HTTPS/WSS and HSTS in production (Strict-Transport-Security header).  
- Apply IP-based rate limiting and throttling on authentication endpoints and matchmaking APIs.  
- Restrict CORS to trusted origins only; avoid wildcard origins.  
- Use correct HTTP verbs (GET for reads, POST for creations, PUT/PATCH for updates, DELETE for removals).  
- Version APIs (e.g., `/api/v1/...`) to allow safe evolution.  
- Return only necessary data in responses; avoid overexposure of internal fields.

---

## 6. Real-Time Communication (Socket.io)

- Limit origins in Socket.io CORS config.  
- Enable connectionStateRecovery for brief network blips; tune `pingInterval`/`pingTimeout` based on real-world latency.  
- Implement a Redis adapter (e.g., `@socket.io/redis-adapter`) for horizontal scaling and pub/sub.  
- Use sticky sessions or consider WebSocket-only mode if poll fallback complicates scaling.  
- Validate every socket event payload with a JSON schema before processing.  
- Cap maximum concurrent rooms and enforce room-length quotas to avoid resource exhaustion.

---

## 7. Web Application Security Hygiene

- Set security headers:
  - Content-Security-Policy to restrict inline scripts/styles and frame sources.  
  - X-Frame-Options: `DENY` or CSP `frame-ancestors`.  
  - X-Content-Type-Options: `nosniff`.  
  - Referrer-Policy: `no-referrer-when-downgrade` or stricter.  
- Protect against CSRF using synchronizer tokens (double-submit cookie) or SameSite cookies with POSTs.  
- Mark cookies `HttpOnly`, `Secure`, and `SameSite` appropriately.  
- Avoid storing any secrets or user data in `localStorage` or `sessionStorage`.

---

## 8. Infrastructure & Configuration Management

- Harden container images:
  - Use official, minimal base images.  
  - Remove unused packages and disable debugging tools in production.  
- Manage secrets with Vault, AWS Secrets Manager, or an equivalent. Do not commit `.env` files containing secrets.  
- Expose only required ports (e.g., 443).  
- Regularly patch OS, language runtimes, and packages.  
- Enforce secure TLS configuration (disable TLS 1.0/1.1; prefer TLS 1.3).  
- Apply strict file system permissions inside containers.

---

## 9. Dependency Management

- Maintain `package-lock.json` or `yarn.lock` for deterministic builds.  
- Vet dependencies for security posture; prefer well-maintained libraries.  
- Integrate SCA (Software Composition Analysis) to scan for known CVEs.  
- Update dependencies promptly; automate via Dependabot or a similar tool.  
- Remove unused or redundant packages to shrink the attack surface.

---

## 10. Game AI & Resource Controls

- Enforce strict time-and node-count limits on Minimax computations to prevent DoS via pathological game states.  
- Use a bounded transposition table (LRU eviction) to avoid unbounded memory growth.  
- Sandbox AI evaluation logic to prevent injection or tampering.  
- If using Zobrist hashing, consider 128-bit keys in security-critical deployments to reduce collision risk.

---

## 11. CI/CD & DevOps Security

- Run automated tests, linters, and vulnerability scans on every pull request.  
- Enforce pre-commit and pre-push hooks for linting and secrets detection.  
- Store CI/CD credentials in a secure secrets store; restrict pipeline permissions to necessary scopes.  
- Use immutable container tags (avoid `latest`) and scan images for vulnerabilities.  
- Implement automated rollback on failed deployments.

---

Adhering to these guidelines will ensure that ft_transcendence remains secure, reliable, and maintainable as it grows. Regularly review and update controls in response to new threats or changes in technology.