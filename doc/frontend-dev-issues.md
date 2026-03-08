# Frontend Issues — Ready for Independent Work

**For:** Frontend developer
**Date:** 2026-03-07
**Context:** These issues are frontend-only, low-risk, and can be worked on independently from the backend bug fixes (Phases A & B). No backend changes required.

**Branch suggestion:** `fix/ui-polish-a11y`
**Run after all changes:** `cd frontend && npm run lint`

---

## Issue #260 — Disconnect warning banner missing warning icon

**Severity:** Low
**File:** `frontend/src/pages/Game.tsx` — lines 216–232

**Problem:** The opponent disconnect banner renders text and countdown but has no warning icon. The test spec expects a visible warning icon.

**What to do:** Add a warning icon (text `⚠️` or an SVG) before the opponent name in the banner JSX at line ~221.

**Before:**
```jsx
<p className="font-semibold text-base">
  {state.opponentName} disconnected.
</p>
```

**After (example):**
```jsx
<p className="font-semibold text-base">
  ⚠️ {state.opponentName} disconnected.
</p>
```

---

## Issue #261 — "Waiting for opponent" text should be neutral gray

**Severity:** Low
**File:** `frontend/src/components/Game/TurnIndicator.tsx` — lines 22–26

**Problem:** When it's the opponent's turn, the text "Waiting for opponent" may inherit the active-player color (cyan for X, pink for O). It should be neutral gray since it's not an active-turn state.

**What to check first:** Verify which prop path renders "Waiting for opponent". If it comes in via `textOverride`, it already gets `text-pong-text/60` (neutral). If it comes through the normal turn path with `isYourTurn === false`, it gets colored.

**Current logic:**
```tsx
const colorClass =
  textOverride !== ""
    ? "text-pong-text/60"
    : (currentPlayer === "X" ? "text-pong-accent" : "text-pong-secondary") +
      (isYourTurn ? " animate-pulse" : "");
```

**Fix:** Ensure the "not your turn" case uses neutral gray instead of the opponent's color. Only color the text when `isYourTurn` is true.

---

## Issue #262 — Remove close (X) from "active game in progress" popup

**Severity:** Low
**File:** `frontend/src/components/ActiveGameBanner.tsx` — lines 38–56

**Problem:** The banner has a dismiss button (X) that lets users close the popup. Once closed, there's no way to reopen it. The popup should only dismiss itself when the game becomes unavailable (forfeit, game over, etc.).

**What to do:** Delete the dismiss `<button>` element (lines 38–56). Remove the `dismissed` state variable and its check if it becomes unused. Keep the "Rejoin" button.

**Also remove:** The `clearActiveGame()` call from the dismiss button — the banner should only clear via socket events (`game_forfeited`, `game_over`, `game_already_ended`) which already handle this in `SocketContext.tsx`.

---

## Issue #253 — No label associated with form fields

**Severity:** Minor (accessibility)
**Files and locations:**

| Location | File | Lines | Problem |
|----------|------|-------|---------|
| Input component | `frontend/src/components/Input.tsx` | ~22 | Renders `<label>` but missing `htmlFor` attribute to associate it with the input |
| Login form | `frontend/src/pages/Login.tsx` | 69–85 | Uses `<Input>` component — inherits the missing `htmlFor` |
| Signup form | `frontend/src/pages/Signup.tsx` | 78–112 | Uses `<Input>` component — same issue, 4 fields |
| Profile edit | `frontend/src/pages/Profile.tsx` | 471–483 | Uses `<p>` tag instead of `<label>` for "Display name" |
| User search | `frontend/src/components/UserSearch.tsx` | 132–147 | Input has `id` but no associated `<label>` (has `aria-label` — ok for visual, but browser still warns) |
| Chat input | `frontend/src/components/Chat/MessageInput.tsx` | 136–147 | Textarea has `id` but no associated `<label>` |

**How to fix the Input component (fixes Login + Signup at once):**

In `Input.tsx`, the `<label>` should get a `htmlFor` that matches the input's `id`. Generate an `id` if not provided:

```tsx
// At top of component:
const inputId = props.id || props.name || `input-${label?.replace(/\s+/g, '-').toLowerCase()}`;

// On the label:
<label htmlFor={inputId} ...>{label}</label>

// On the input:
<input id={inputId} {...props} />
```

**Profile.tsx fix:** Change the `<p>` at line ~472 to `<label htmlFor="display-name">`.

**UserSearch / MessageInput:** Add a visually hidden `<label>` or wrap in `<label>`:
```tsx
<label htmlFor={inputId} className="sr-only">Search users</label>
```

---

## Issue #252 — Form fields missing `id` or `name` attribute

**Severity:** Minor (accessibility/autofill)
**File:** `frontend/src/components/Input.tsx` — lines 7–29

**Problem:** The `Input` component spreads props via `{...props}`, but Login.tsx and Signup.tsx don't pass `id` or `name` to it. The browser warns about missing attributes for autofill.

**How to fix:** Same fix as #253 — generate an `id` from the `label` or `name` prop if not provided explicitly. Then pass `id` and `name` to the underlying `<input>`:

```tsx
const inputId = props.id || props.name || `input-${label?.replace(/\s+/g, '-').toLowerCase()}`;
const inputName = props.name || inputId;

<input id={inputId} name={inputName} {...props} />
```

**Then in Login.tsx / Signup.tsx**, add `name` props for autofill:

| Field | `name` value | `autoComplete` value |
|-------|-------------|---------------------|
| Email | `email` | `email` |
| Username | `username` | `username` |
| Password | `password` | `current-password` (login) / `new-password` (signup) |
| Confirm Password | `confirm-password` | `new-password` |

---

## Summary

| Issue | File(s) | Effort | Risk |
|-------|---------|--------|------|
| #260 | Game.tsx | 5 min | None |
| #261 | TurnIndicator.tsx | 10 min | Low — verify color logic first |
| #262 | ActiveGameBanner.tsx | 10 min | Low — test that socket events still dismiss |
| #253 | Input.tsx, Profile.tsx, UserSearch.tsx, MessageInput.tsx | 30 min | Low |
| #252 | Input.tsx, Login.tsx, Signup.tsx | 20 min | Low |

**Total estimated scope:** ~1 hour of focused work.

**Validation after all changes:**
1. `cd frontend && npm run lint` — zero new warnings
2. Open Login, Signup, Profile — zero browser console accessibility warnings
3. Open a game, disconnect one player — warning icon visible
4. "Waiting for opponent" text is gray, "Your turn" is colored
5. Active game banner has no X button, dismisses only on game end
