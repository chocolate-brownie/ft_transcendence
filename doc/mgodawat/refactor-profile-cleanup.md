# Refactor: Profile.tsx Component Extraction

**When:** After all 3 disconnection bug-fix PRs are merged.
**Branch:** `refactor/profile-cleanup`
**Risk:** Low — pure UI extraction, no logic changes, no backend changes.

---

## Problem

`Profile.tsx` is 615 lines — the largest frontend file. It contains:
- Profile data fetching + visibility refresh
- Friends list fetching + real-time socket listeners
- Pending requests fetching + real-time socket listeners
- Avatar upload with file picker, validation, and ref management
- Display name editing with validation
- Stats rendering
- Friend action handlers (accept, reject, remove)
- Full page layout with two-column grid

Teammates find it hard to navigate and understand.

---

## Extraction Plan

Extract **3 focused components**. No logic changes. No new features. Just move code.

### 1. `ProfileStats.tsx` (~40 lines)

**Extract from:** Lines 518–556 (stats card)
**Props:** `{ wins: number; losses: number; draws: number }`
**Why:** Self-contained, zero dependencies, easiest extraction.

```
frontend/src/components/Profile/ProfileStats.tsx
```

### 2. `AvatarUpload.tsx` (~100 lines)

**Extract from:** Lines 375–427 (avatar button/image/overlay) + lines 262–301 (handlers) + lines 36–37 (refs) + lines 54–55 (state)
**Props:**
```ts
{
  avatarSrc: string;
  isMine: boolean;
  avatarSaving: boolean;
  avatarError: string | null;
  onAvatarChange: (file: File) => void;
}
```
**Why:** The avatar upload has its own refs (`fileInputRef`, `avatarSavingRef`), its own state, its own validation, and a tricky `cancel` event listener. Isolating it makes the file picker logic self-documenting.

**Move internally:** The `fileInputRef`, `avatarSavingRef`, `avatarSaving`/`avatarError` state, `handleAvatarChange`, and `handleAvatarUpload` all move into this component. The parent only passes `profile`, `updateUser`, and a success callback.

Revised props (self-contained version):
```ts
{
  avatarSrc: string;
  isMine: boolean;
  onUploadSuccess: (avatarUrl: string) => void;
}
```

```
frontend/src/components/Profile/AvatarUpload.tsx
```

### 3. `DisplayNameForm.tsx` (~70 lines)

**Extract from:** Lines 462–498 (edit form UI) + lines 207–259 (handlers) + lines 39–43 (state)
**Props:**
```ts
{
  currentName: string;
  onSave: (newName: string) => Promise<void>;
  onCancel: () => void;
}
```
**Why:** Edit mode is a self-contained form with its own validation and state. Extracting it removes 5 state variables and 4 handlers from the parent.

```
frontend/src/components/Profile/DisplayNameForm.tsx
```

---

## What Stays in Profile.tsx

After extraction, `Profile.tsx` drops to ~350 lines and contains:
- Route param resolution + redirects
- Profile fetch + visibility listener
- Friends/pending fetch + socket listeners (already delegate rendering to `FriendsList` and `PendingRequests`)
- Friend action handlers (accept, reject, remove) — these mutate friends state used by multiple child components
- Page layout grid

This is reasonable for a page component that orchestrates data fetching and layout.

---

## File Structure After

```
frontend/src/components/Profile/
  ProfileStats.tsx      (new)
  AvatarUpload.tsx      (new)
  DisplayNameForm.tsx   (new)
frontend/src/pages/
  Profile.tsx           (slimmed from 615 → ~350 lines)
```

---

## Rules

- No logic changes. Move code only.
- No new features, no new dependencies.
- No changes to props/behavior of existing child components (`FriendsList`, `PendingRequests`, `FriendRequestButton`).
- Run `npm run lint` in `frontend/` after extraction — zero new warnings.
- Visual output must be identical before and after (manual check in browser).

---

## Validation

1. Open own profile → avatar upload works, edit name works, stats display, friends list loads
2. Open another user's profile → friend request button works, stats display
3. Real-time: receive a friend request while on profile → appears in pending
4. `npm run lint` passes with no new warnings
5. No console errors

---

## Agent-Teams Implementer Execution Plan

Use this when ready to execute. Spawn a single `team-implementer` agent with the following task:

```
TASK: Extract 3 components from frontend/src/pages/Profile.tsx

FILE OWNERSHIP:
- Agent owns: frontend/src/components/Profile/ProfileStats.tsx (CREATE)
- Agent owns: frontend/src/components/Profile/AvatarUpload.tsx (CREATE)
- Agent owns: frontend/src/components/Profile/DisplayNameForm.tsx (CREATE)
- Agent owns: frontend/src/pages/Profile.tsx (MODIFY)

INSTRUCTIONS:

Step 1 — Create ProfileStats.tsx
  - Extract the stats card (lines 518–556 of Profile.tsx)
  - Accept props: { wins: number; losses: number; draws: number }
  - Include the Card wrapper, grid layout, and win rate calculation
  - Export as default

Step 2 — Create AvatarUpload.tsx
  - Extract the avatar button, image, overlay, hidden file input (lines 375–427)
  - Move INTO the component: fileInputRef, avatarSavingRef, avatarSaving state,
    avatarError state, handleAvatarChange, handleAvatarUpload
  - Props: { avatarSrc: string; isMine: boolean;
             onUploadSuccess: (avatarUrl: string) => void }
  - The component calls usersService.uploadAvatar internally
  - Preserve the cancel event listener on fileInputRef
  - Export as default

Step 3 — Create DisplayNameForm.tsx
  - Extract the edit form UI (lines 462–498)
  - Move INTO the component: isEditing state, editDisplayName state,
    saving state, editError state, handleDisplayNameChange, handleSave logic
  - Props: { currentName: string;
             onSaveSuccess: (newDisplayName: string) => void }
  - The component calls usersService.updateMe internally
  - Include 3-50 char validation and HTML tag stripping
  - Export as default
  - Parent Profile.tsx only renders <DisplayNameForm> when isMine is true
  - Parent provides a toggle: edit button calls setIsEditing(true), form cancel
    calls setIsEditing(false). OR move isEditing state into the component itself
    (simpler — component renders either an "Edit Profile" button or the form).

Step 4 — Update Profile.tsx
  - Import the 3 new components
  - Replace inline JSX with component usage
  - Remove moved state variables, refs, and handlers
  - Keep: profile fetch, friends fetch, pending fetch, socket listeners,
    friend action handlers, page layout, derived values
  - Verify all imports are correct

Step 5 — Lint check
  - Run: cd frontend && npx eslint src/pages/Profile.tsx
                         src/components/Profile/ProfileStats.tsx
                         src/components/Profile/AvatarUpload.tsx
                         src/components/Profile/DisplayNameForm.tsx
  - Fix any errors

CONSTRAINTS:
  - Do NOT change any logic or behavior
  - Do NOT add new dependencies
  - Do NOT modify any other files
  - Do NOT add comments, docstrings, or type annotations beyond what exists
  - Preserve exact Tailwind classes — visual output must be identical
```

---

## Estimated Impact

| Metric | Before | After |
|--------|--------|-------|
| Profile.tsx lines | 615 | ~350 |
| New files | 0 | 3 |
| Total lines (all 4 files) | 615 | ~615 (same code, better organized) |
| Logic changes | — | None |
