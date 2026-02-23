// Issue #27 — Test Protected Routes (Frontend E2E)
// Playwright tests — requires the full stack to be running (Docker or local)
// Run: npm run test:e2e (from frontend/)
//
// Pre-condition: a test account must exist in the database.
// Create one with: POST /api/auth/signup { email, username, password }
// or use the signup page before running these tests.
//
// Credentials used here must match an account in the running DB.

import { test, expect, type Page } from "@playwright/test";

// ─── Test credentials ────────────────────────────────────────────────────────

const TEST_EMAIL = process.env.E2E_EMAIL ?? "e2e_login_test@example.com";
const TEST_PASSWORD = process.env.E2E_PASSWORD ?? "E2eTestPass1x";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function loginAndGetToken(page: Page): Promise<string> {
  await page.goto("/login");
  await page.locator('input[autocomplete="email"]').fill(TEST_EMAIL);
  await page.locator('input[autocomplete="current-password"]').fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /log in/i }).click();
  await page.waitForURL("/", { timeout: 8000 });
  const token = await page.evaluate(() => localStorage.getItem("token"));
  if (!token) throw new Error("Login succeeded but no token in localStorage");
  return token;
}

// ─── Test Setup ──────────────────────────────────────────────────────────────

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe("Protected routes — access control", () => {
  // ── Valid Token (happy path) ────────────────────────────────────────────────

  test.describe("With valid token (logged in)", () => {
    test("can access /profile after login", async ({ page }) => {
      await loginAndGetToken(page);

      await page.goto("/profile");
      await page.waitForLoadState("networkidle");

      await expect(page).not.toHaveURL("/login");
      await expect(page).toHaveURL("/profile");
    });

    test("can access /game after login", async ({ page }) => {
      await loginAndGetToken(page);

      await page.goto("/game");
      await page.waitForLoadState("networkidle");

      await expect(page).not.toHaveURL("/login");
      await expect(page).toHaveURL("/game");
    });

    test("profile page displays user data (from GET /api/auth/me)", async ({ page }) => {
      await loginAndGetToken(page);

      await page.goto("/profile");
      await page.waitForLoadState("networkidle");

      // The profile page must render something meaningful — not be empty or an error
      const body = await page.locator("body").textContent();
      expect(body).not.toBeNull();
      expect(body!.trim().length).toBeGreaterThan(0);
    });
  });

  // ── No Token (not logged in) ────────────────────────────────────────────────

  test.describe("Without token (not logged in)", () => {
    test("redirects /profile to /login when not logged in", async ({ page }) => {
      await page.goto("/profile");
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveURL("/login", { timeout: 5000 });
    });

    test("redirects /game to /login when not logged in", async ({ page }) => {
      await page.goto("/game");
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveURL("/login", { timeout: 5000 });
    });

    test("redirects /profile/:id to /login when not logged in", async ({ page }) => {
      await page.goto("/profile/42");
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveURL("/login", { timeout: 5000 });
    });

    test("redirects /game/:id to /login when not logged in", async ({ page }) => {
      await page.goto("/game/some-game-id");
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveURL("/login", { timeout: 5000 });
    });
  });

  // ── Clearing Token Manually ────────────────────────────────────────────────

  test.describe("Token cleared from localStorage", () => {
    test("redirects to /login after token is manually removed", async ({ page }) => {
      await loginAndGetToken(page);

      // Remove the token manually (simulating a user clearing browser storage)
      await page.evaluate(() => localStorage.removeItem("token"));

      await page.goto("/profile");
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveURL("/login", { timeout: 5000 });
    });

    test("redirects to /login after localStorage is fully cleared", async ({ page }) => {
      await loginAndGetToken(page);

      await page.evaluate(() => localStorage.clear());

      await page.goto("/game");
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveURL("/login", { timeout: 5000 });
    });
  });

  // ── Invalid / Tampered Token ────────────────────────────────────────────────

  test.describe("With invalid token", () => {
    test("redirects /profile to /login when token is tampered", async ({ page }) => {
      await loginAndGetToken(page);

      // Flip the last character of the token to invalidate the signature
      await page.evaluate(() => {
        const token = localStorage.getItem("token") ?? "";
        const tampered = token.slice(0, -1) + (token.slice(-1) === "a" ? "b" : "a");
        localStorage.setItem("token", tampered);
      });

      await page.goto("/profile");
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveURL("/login", { timeout: 5000 });
    });

    test("redirects /profile to /login when token is a random string", async ({ page }) => {
      await page.evaluate(() => localStorage.setItem("token", "not-a-valid-jwt"));

      await page.goto("/profile");
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveURL("/login", { timeout: 5000 });
    });

    test("token is removed from localStorage after an invalid token is rejected", async ({ page }) => {
      await page.evaluate(() => localStorage.setItem("token", "not-a-valid-jwt"));

      await page.goto("/profile");
      await page.waitForLoadState("networkidle");

      const token = await page.evaluate(() => localStorage.getItem("token"));
      expect(token).toBeNull();
    });
  });

  // ── Session Refresh ────────────────────────────────────────────────────────

  test.describe("Session persistence across navigation", () => {
    test("stays on /profile after page reload (token survives reload)", async ({ page }) => {
      await loginAndGetToken(page);

      await page.goto("/profile");
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL("/profile");

      await page.reload();
      await page.waitForLoadState("networkidle");

      await expect(page).not.toHaveURL("/login");
      await expect(page).toHaveURL("/profile");
    });

    test("can navigate between protected routes while logged in", async ({ page }) => {
      await loginAndGetToken(page);

      await page.goto("/profile");
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL("/profile");

      await page.goto("/game");
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL("/game");
    });
  });

  // ── Multi-tab: logout ──────────────────────────────────────────────────────

  test.describe("Multi-tab logout", () => {
    test("accessing a protected route after token removal reflects logged-out state", async ({ page }) => {
      // Login and land on home
      await loginAndGetToken(page);

      // Go to profile while logged in
      await page.goto("/profile");
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL("/profile");

      // Simulate another tab logging out by removing the token
      await page.evaluate(() => localStorage.removeItem("token"));

      // Navigating to a protected route now should redirect
      await page.goto("/profile");
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveURL("/login", { timeout: 5000 });
    });
  });
});
