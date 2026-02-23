// Issue #26 — Test Login Flow (Frontend E2E)
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
// These must exist in the database before running E2E tests.
// You can change these or set them via environment variables.

const TEST_EMAIL = process.env.E2E_EMAIL ?? "e2e_login_test@example.com";
const TEST_PASSWORD = process.env.E2E_PASSWORD ?? "E2eTestPass1x";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fillLoginForm(page: Page, email: string, password: string) {
  await page.locator('input[autocomplete="email"]').fill(email);
  await page.locator('input[autocomplete="current-password"]').fill(password);
}

async function submitLoginForm(page: Page) {
  await page.getByRole("button", { name: /log in/i }).click();
}

// ─── Test Setup ──────────────────────────────────────────────────────────────

test.beforeEach(async ({ page }) => {
  // Clear localStorage before each test to start from a clean state
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe("Login page — /login", () => {
  // ── Happy Path ─────────────────────────────────────────────────────────────

  test.describe("Valid credentials (happy path)", () => {
    test("redirects to home page after successful login", async ({ page }) => {
      await page.goto("/login");
      await fillLoginForm(page, TEST_EMAIL, TEST_PASSWORD);
      await submitLoginForm(page);

      await expect(page).toHaveURL("/", { timeout: 8000 });
    });

    test("stores JWT in localStorage after login", async ({ page }) => {
      await page.goto("/login");
      await fillLoginForm(page, TEST_EMAIL, TEST_PASSWORD);
      await submitLoginForm(page);

      await page.waitForURL("/", { timeout: 8000 });

      const token = await page.evaluate(() => localStorage.getItem("token"));
      expect(token).not.toBeNull();
      expect(typeof token).toBe("string");
      expect(token!.length).toBeGreaterThan(0);
    });

    test("replaces the JWT in localStorage on a second login", async ({ page }) => {
      // First login
      await page.goto("/login");
      await fillLoginForm(page, TEST_EMAIL, TEST_PASSWORD);
      await submitLoginForm(page);
      await page.waitForURL("/", { timeout: 8000 });
      const token1 = await page.evaluate(() => localStorage.getItem("token"));

      // Wait 1s so JWT iat differs (iat resolution is 1 second)
      await page.waitForTimeout(1100);

      // Second login
      await page.goto("/login");
      await fillLoginForm(page, TEST_EMAIL, TEST_PASSWORD);
      await submitLoginForm(page);
      await page.waitForURL("/", { timeout: 8000 });
      const token2 = await page.evaluate(() => localStorage.getItem("token"));

      expect(token1).not.toBeNull();
      expect(token2).not.toBeNull();
      expect(token1).not.toBe(token2);
    });
  });

  // ── Wrong Credentials ──────────────────────────────────────────────────────

  test.describe("Wrong credentials", () => {
    test("shows error message for wrong password", async ({ page }) => {
      await page.goto("/login");
      await fillLoginForm(page, TEST_EMAIL, "WrongPassword999!");
      await submitLoginForm(page);

      await expect(page.locator("text=Invalid")).toBeVisible({ timeout: 5000 });
      await expect(page).not.toHaveURL("/");
    });

    test("shows error message for non-existent email", async ({ page }) => {
      await page.goto("/login");
      await fillLoginForm(page, "ghost_nobody@example.com", TEST_PASSWORD);
      await submitLoginForm(page);

      await expect(page.locator("text=Invalid")).toBeVisible({ timeout: 5000 });
      await expect(page).not.toHaveURL("/");
    });

    test("error message is the same for wrong password and non-existent email", async ({ page }) => {
      // Wrong password
      await page.goto("/login");
      await fillLoginForm(page, TEST_EMAIL, "WrongPassword999!");
      await submitLoginForm(page);
      await page.waitForTimeout(500);
      const msg1 = await page.locator("p.text-red-500").textContent();

      // Non-existent email
      await page.goto("/login");
      await fillLoginForm(page, "ghost_nobody@example.com", TEST_PASSWORD);
      await submitLoginForm(page);
      await page.waitForTimeout(500);
      const msg2 = await page.locator("p.text-red-500").textContent();

      expect(msg1).toBe(msg2);
    });
  });

  // ── Input Validation (client-side, before submit) ──────────────────────────

  test.describe("Input validation", () => {
    test("shows error when email is empty and form is submitted", async ({ page }) => {
      await page.goto("/login");
      await page.locator('input[autocomplete="current-password"]').fill(TEST_PASSWORD);
      await submitLoginForm(page);

      await expect(page.locator("p.text-red-500")).toBeVisible();
    });

    test("shows error when password is empty and form is submitted", async ({ page }) => {
      await page.goto("/login");
      await page.locator('input[autocomplete="email"]').fill(TEST_EMAIL);
      await submitLoginForm(page);

      await expect(page.locator("p.text-red-500")).toBeVisible();
    });

    test("shows error when email format is invalid", async ({ page }) => {
      await page.goto("/login");
      await fillLoginForm(page, "not-an-email", TEST_PASSWORD);
      await submitLoginForm(page);

      await expect(page.locator("p.text-red-500")).toBeVisible();
      const msg = await page.locator("p.text-red-500").textContent();
      expect(msg).toMatch(/invalid email/i);
    });

    test("shows error when both fields are empty", async ({ page }) => {
      await page.goto("/login");
      await submitLoginForm(page);

      await expect(page.locator("p.text-red-500")).toBeVisible();
    });
  });

  // ── Session Persistence ────────────────────────────────────────────────────

  test.describe("Session persistence", () => {
    test("session survives a page refresh (token in localStorage)", async ({ page }) => {
      // Login
      await page.goto("/login");
      await fillLoginForm(page, TEST_EMAIL, TEST_PASSWORD);
      await submitLoginForm(page);
      await page.waitForURL("/", { timeout: 8000 });

      // Reload and verify still authenticated (not redirected to /login)
      await page.reload();
      await page.waitForLoadState("networkidle");
      await expect(page).not.toHaveURL("/login");

      // Token must still be present
      const token = await page.evaluate(() => localStorage.getItem("token"));
      expect(token).not.toBeNull();
    });

    test("manual localStorage deletion triggers re-authentication on protected route", async ({ page }) => {
      // Login first
      await page.goto("/login");
      await fillLoginForm(page, TEST_EMAIL, TEST_PASSWORD);
      await submitLoginForm(page);
      await page.waitForURL("/", { timeout: 8000 });

      // Delete token manually
      await page.evaluate(() => localStorage.removeItem("token"));

      // Navigate to a protected route — should be redirected to /login
      await page.goto("/profile");
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL("/login", { timeout: 5000 });
    });
  });

  // ── Already Authenticated ──────────────────────────────────────────────────

  test.describe("Already authenticated", () => {
    test("visiting /login while authenticated still shows the login form (no redirect implemented)", async ({ page }) => {
      // Login
      await page.goto("/login");
      await fillLoginForm(page, TEST_EMAIL, TEST_PASSWORD);
      await submitLoginForm(page);
      await page.waitForURL("/", { timeout: 8000 });

      // Visit /login again while authenticated
      await page.goto("/login");
      await page.waitForLoadState("networkidle");

      // /login has no redirect-if-authenticated guard — the form is shown as-is
      await expect(page).toHaveURL("/login");
      await expect(page.getByRole("button", { name: /log in/i })).toBeVisible();

      // Token must still be present (visiting /login must not clear the session)
      const token = await page.evaluate(() => localStorage.getItem("token"));
      expect(token).not.toBeNull();
    });
  });

  // ── Rapid Form Submission ──────────────────────────────────────────────────

  test.describe("Rapid form submission", () => {
    test("submit button shows loading state and is disabled while request is in flight", async ({ page }) => {
      await page.goto("/login");
      await fillLoginForm(page, TEST_EMAIL, TEST_PASSWORD);

      // Start clicking and immediately race to catch the loading state.
      // The button text switches synchronously to "Logging in…" on click (React state),
      // before any network response — so we can reliably catch it.
      const clickAndCheck = Promise.all([
        page.getByRole("button", { name: /log in/i }).click(),
        expect(page.getByRole("button", { name: /logging in/i })).toBeVisible({ timeout: 2000 }),
      ]);

      await clickAndCheck;

      // The loading button must be disabled
      await expect(page.getByRole("button", { name: /logging in/i })).toBeDisabled();
    });

  });
});
