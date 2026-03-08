# Frontend Bug Fix Guide — Avatar 404 + UI/Accessibility

**Issues:** #251, #250, #260, #261, #262, #253, #252
**Branches:** `fix/avatar-404` and `fix/ui-polish-a11y`
**Status:** NOT STARTED

---

## How to Use This Guide

This guide teaches you how to debug and fix frontend issues — not just what to change, but WHY and HOW to find the problem yourself. Each section has a learning objective. The quiz at the end gates you before coding.

---

## Gate Quiz — Answer Before Writing Any Code

Write your answers on paper. Come back to check them after reading the guide.

**Q1.** A user has a screen reader. Your form has `<input type="text" placeholder="Enter name" />` with no `<label>`. What does the screen reader announce when focus lands on that input?

**Q2.** You have `<img src="/uploads/avatars/abc.png" onError={(e) => { e.currentTarget.src = "/default.png" }} />`. The `onError` fires and swaps `src` to `/default.png`. But that file also 404s. What happens in the browser? What does the user see?

**Q3.** Your Vite dev server proxies `/uploads/*` to the backend container. After `make fclean` wipes the Docker volume, what files survive? What files are gone?

---

## Part 1: Static Asset 404s (Issues #251, #250)

**Learning objective:** Understand the difference between bundled assets and runtime uploads, trace a 404 in DevTools, and fix the avatar fallback chain.

### 1.1 Two Kinds of Assets

Before debugging, hold two categories in your head:

**Bundled assets** live in `frontend/public/`. Vite copies them into the Docker image at build time. They survive `make fclean` because they're baked into the image layer.

**Runtime uploads** land in `backend/uploads/` when users upload files. They're on a Docker bind mount. When you `docker compose down -v`, the database volume is wiped — but the bind mount (`./backend/uploads:/app/uploads:z`) actually survives because it's a host directory, not a named volume.

The bug is simpler than you'd think: the file simply doesn't exist.

### 1.2 Diagnostic Method — Trace the 404

Do this before forming a hypothesis:

1. Open DevTools → Network tab → filter by "Img"
2. Reload the page (or trigger the broken state)
3. Find the failing request. Note the **exact URL**
4. Click it → "Initiator" tab tells you which JSX line made the request
5. Check: is the 404 on the primary `src` or on the `onError` fallback?

**Discovery prompt:** Open the app, navigate to the Scoreboard or any avatar. What exact URL fails? Is it `/uploads/avatars/default.png` or `/default-avatar.png`?

### 1.3 The Actual Root Cause

The Prisma schema at `backend/prisma/schema.prisma:20` sets every new user's `avatarUrl` to `"/uploads/avatars/default.png"`. But that file has never been created or committed to the repo.

The backend service (`users.service.ts:12-18`) normalizes this: if the URL contains `"default.png"`, it returns `null` to the frontend. The frontend then falls back to `/default-avatar.png` (which exists in `frontend/public/` at 656KB).

So the **primary UI path works**. The 404 happens when:
- A code path bypasses `normalizeAvatarUrl` (e.g., raw Prisma responses)
- The Scoreboard component receives the raw Prisma default URL
- After a DB wipe, all users get the nonexistent default URL

### 1.4 The Fix

**Option A (simplest):** Place a `default.png` image file in `backend/uploads/avatars/` and commit it. This makes the Prisma default URL actually resolve.

How to do it:
```bash
cp frontend/public/default-avatar.png backend/uploads/avatars/default.png
git add backend/uploads/avatars/default.png
```

Then update `.gitignore` if needed — currently `uploads/avatars/*` is ignored. You need an exception:
```gitignore
backend/uploads/avatars/*
!backend/uploads/avatars/default.png
!backend/uploads/avatars/.gitkeep
```

**Also verify:** Every `<img>` that displays an avatar has an `onError` fallback. Here's the current audit:

| File | Has onError? |
|------|-------------|
| `Profile.tsx:412` | Yes — `/default-avatar.png` |
| `UserSearch.tsx:86` | Yes — `/default-avatar.png` |
| `Scoreboard.tsx:28` | Yes — `/default-avatar.png` |
| `ConversationItem.tsx` | Yes |
| `MessageBubble.tsx` | Yes |
| `Navbar.tsx` | Yes |

All fallbacks point to `/default-avatar.png` in `frontend/public/`, which exists. The chain is sound once the primary 404 is fixed.

### 1.5 Verification

- [ ] `docker compose down -v && make` → load app → no broken image icons anywhere
- [ ] Create a new user (fresh DB) → avatar displays correctly
- [ ] Open DevTools Console → zero 404 errors for avatar requests
- [ ] `ls backend/uploads/avatars/default.png` → file exists

---

## Part 2: Accessibility — Form Labels & Attributes (Issues #253, #252)

**Learning objective:** Understand why `<label htmlFor>` matters, fix a shared component to cascade the fix to all forms.

### 2.1 Why This Matters (Not Just "Accessibility")

A `<label>` is not visual decoration. It's a **programmatic association**. The browser uses it to answer: "what is this control for?"

Without it:
- Screen readers announce "text field" with no context
- Clicking the label text does NOT focus the input (try it!)
- Browser autofill can't match saved credentials to fields without `name`

**The test:** Click the label text on your Login form. Does focus move to the input? If not, the association is broken.

### 2.2 The Core Problem — `Input.tsx`

**File:** `frontend/src/components/Input.tsx:7-29`

The shared `Input` component renders a `<label>` but doesn't associate it:

```tsx
// Line 22 — label has no htmlFor
{label && <label className="text-sm text-pong-text/60">{label}</label>}

// Lines 24-29 — input has no guaranteed id or name
<input type={inputType} className={...} {...props} />
```

**Why this is a component-level fix:** `Input` is used in Login (2 fields), Signup (4 fields), and potentially elsewhere. Fix it once → all 6+ fields are fixed.

### 2.3 What to Change in `Input.tsx`

1. Import `useId` from React (generates stable unique IDs)
2. Generate an ID: `const generatedId = useId();`
3. Derive the actual ID: `const inputId = props.id || generatedId;`
4. Add `htmlFor={inputId}` to the `<label>`
5. Add `id={inputId}` and `name={props.name || inputId}` to the `<input>` (before `{...props}` so callers can override)

**Why `useId()` instead of hardcoding?** If the component is rendered twice on the same page (e.g., two text fields), hardcoded IDs would clash. `useId()` generates unique IDs per component instance.

### 2.4 One More Location — Profile.tsx

**File:** `frontend/src/pages/Profile.tsx:472`

The display name edit field uses a `<p>` tag instead of `<label>`:
```tsx
<p className="mb-1 block text-xs font-medium text-pong-text/60">
  Display name
</p>
<input id="display-name" name="display-name" ... />
```

**Fix:** Change `<p>` to `<label htmlFor="display-name">`. Keep the same classes.

### 2.5 Files That Are Already Fine

These already have `id`, `name`, and `aria-label` — no changes needed:
- `UserSearch.tsx:133-134`
- `MessageInput.tsx:137-138`

### 2.6 Verification

- [ ] Click every label on Login, Signup, Profile → focus moves to the correct input
- [ ] DevTools → Elements → select each input → Accessibility pane shows the label text as "accessible name"
- [ ] No two inputs on the same page share the same `id`
- [ ] Browser autofill works on Login form (email + password)
- [ ] `npm run lint` → zero new warnings

---

## Part 3: UI Polish (Issues #260, #261, #262)

**Learning objective:** Read component props to trace styles and text, apply minimal UI changes.

### 3.1 Issue #260 — Add Warning Icon to Disconnect Banner

**File:** `frontend/src/pages/Game.tsx:216-232`

**Current banner (line 221):**
```tsx
<p className="text-sm font-semibold text-carrot-orange-700">
  {gameState.disconnectedOpponentName ?? "Opponent"} disconnected.
</p>
```

**What to do:** Add a warning icon inline. Wrap the `<p>` content in a flex container:

```tsx
<p className="flex items-center gap-2 text-sm font-semibold text-carrot-orange-700">
  <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
  </svg>
  {gameState.disconnectedOpponentName ?? "Opponent"} disconnected.
</p>
```

That SVG is the Heroicons "exclamation-triangle" outline icon. Same color class (`text-carrot-orange-700`) applies via `currentColor`.

### 3.2 Issue #261 — Neutral Gray for "Waiting for Opponent"

**File:** `frontend/src/components/Game/TurnIndicator.tsx:22-26`

**Current logic:**
```tsx
const colorClass =
  textOverride !== ""
    ? "text-pong-text/60"
    : (currentPlayer === "X" ? "text-pong-accent" : "text-pong-secondary") +
      (isYourTurn ? " animate-pulse" : "");
```

When `isYourTurn` is `false`, the text still gets the player's color (cyan/pink). It should be neutral gray.

**Fix:** Only apply color + pulse when it IS your turn:

```tsx
const colorClass =
  textOverride !== ""
    ? "text-pong-text/60"
    : isYourTurn
      ? (currentPlayer === "X" ? "text-pong-accent" : "text-pong-secondary") + " animate-pulse"
      : "text-pong-text/60";
```

**How to verify:** Start a game. When it's your turn, text should be colored (cyan for X, pink for O) with a pulse. When it's the opponent's turn, text should be neutral gray with no pulse.

### 3.3 Issue #262 — Remove Close Button from Active Game Banner

**File:** `frontend/src/components/ActiveGameBanner.tsx`

**What to remove:**
1. **Line ~14:** `const [dismissed, setDismissed] = useState(false);` — the dismissed state
2. **Line ~20:** Remove `|| dismissed` from the early return guard
3. **Lines ~38-56:** The entire `<button>` element with the X SVG icon

**Why remove instead of disable?** A disabled button signals "this action might be possible." Removing it sets the correct expectation: the banner stays until the game ends. The banner already auto-dismisses via socket events (`game_forfeited`, `game_over`, `game_already_ended`) handled in `SocketContext.tsx`.

### 3.4 Verification

- [ ] Disconnect a player → warning banner shows with a visible warning icon
- [ ] Start a game → "Your turn" = colored + pulse, "Waiting for opponent" = neutral gray
- [ ] Active game banner → no X/close button visible
- [ ] Navigate away and back with active game → banner still visible, only way to interact is "Rejoin"
- [ ] Forfeit fires → banner auto-dismisses (no manual close needed)

---

## Part 4: Quiz Answers

Check your answers from the beginning.

<details>
<summary>Q1 — Screen reader with no label</summary>

A screen reader announces "text field" or reads the `placeholder` text. But `placeholder` is NOT a label substitute — it disappears when typing, has lower contrast, and isn't reliably announced by all screen readers. The fix: add a `<label htmlFor>` that matches the input's `id`.

</details>

<details>
<summary>Q2 — onError fallback also 404s</summary>

When `onError` fires and sets a new `src` that also 404s, `onError` fires again. If your handler unconditionally sets the same fallback `src`, you get an **infinite loop** of failed requests. The browser may throttle it. The user sees a broken image icon. The fix: the fallback must point to a guaranteed-present bundled asset (`frontend/public/`), and you should guard against re-entrant `onError` calls.

</details>

<details>
<summary>Q3 — What survives make fclean?</summary>

`make fclean` wipes named Docker volumes (database data). The `backend/uploads/` directory is a bind mount to the host filesystem — it survives. But the DB is gone, so all user records now reference the Prisma default avatar URL (`/uploads/avatars/default.png`). If that file doesn't exist on disk, every avatar request 404s. Files in `frontend/public/` survive because they're baked into the Docker image at build time.

</details>

---

## Execution Order

1. **Start with `Input.tsx`** (#252, #253) — highest leverage, one fix cascades to 6+ fields
2. **Fix `Profile.tsx` label** (#253) — 1-line change
3. **Add `default.png`** (#251, #250) — copy file + gitignore update
4. **Warning icon** (#260) — paste SVG into Game.tsx
5. **Turn indicator color** (#261) — rearrange ternary in TurnIndicator.tsx
6. **Remove close button** (#262) — delete code from ActiveGameBanner.tsx
7. **Run `cd frontend && npm run lint`** — must pass with zero new warnings

---

## PR Plan

**PR 1 — `fix/avatar-404`** (closes #251, #250)
- Add `default.png` to `backend/uploads/avatars/`
- Update `.gitignore` exception

**PR 2 — `fix/ui-polish-a11y`** (closes #253, #252, #260, #261, #262)
- Fix `Input.tsx` with `useId()` for label association + id/name
- Fix `Profile.tsx` label tag
- Add warning icon to Game.tsx disconnect banner
- Fix TurnIndicator.tsx color logic
- Remove close button from ActiveGameBanner.tsx

---

## Concepts You Learned

After completing these fixes, you should be able to explain:

1. **Bundled vs runtime assets** — what survives a volume wipe, what doesn't
2. **`onError` fallback chains** — why fallbacks must point to guaranteed-present files
3. **Programmatic label association** — `htmlFor` + `id`, not just visual proximity
4. **Component-level vs page-level fixes** — fix the abstraction, not every usage
5. **`useId()` in React** — generating stable unique IDs for accessible forms
