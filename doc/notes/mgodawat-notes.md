# Issue #48 / PR #106 — Friend Request UI Notes

## Scope
Implemented and stabilized the Friend Request UI flow for Phase 3:
- Send request from another user's profile
- View pending requests on own profile
- Accept/decline requests
- Show correct relationship states (`Add Friend`, `Request Sent`, `Friends ✓`)

## What we changed
- Added typed friendship status flow in frontend (`none`, `pending_sent`, `pending_received`, `friends`).
- Added/used `getFriendshipStatus` API in frontend service.
- Extracted friend action UI into `FriendRequestButton` component and wired it in `Profile`.
- Kept `PendingRequests` component for incoming requests and count badge.
- Aligned Friend/Pending UI cards with project theme (`pong` colors instead of slate styles).

## Testing issues found and fixes
1. **Remove/Decline threw JSON parse error**
- Error: `Failed to execute 'json' on 'Response': Unexpected end of JSON input`
- Cause: API client always parsed JSON even for `204 No Content` responses.
- Fix: Updated `apiClient` to handle `204/205`, parse JSON only when content-type is JSON, and read backend `{ error }` messages.

2. **Decline flow produced confusing 404 error**
- Cause: Same API client error handling issue masked backend error payload.
- Fix: Same `apiClient` patch now surfaces correct backend error text.

3. **Friends/Pending cards did not match global theme**
- Cause: Components used `slate-*` palette inconsistent with app theme.
- Fix: Restyled `FriendsList` and `PendingRequests` to use `pong` palette and consistent borders/text/hover states.

4. **Default avatar inconsistent (Navbar vs Profile)**
- Cause: Different fallback logic and edge cases for `avatarUrl` values containing default-like paths.
- Fix: Unified fallback logic across Navbar/Profile/Friends views to use `/default-avatar.png` unless a valid custom `/uploads/` avatar is present.

5. **Avatar privacy rule not enforced in all views**
- Requirement: Before friendship acceptance, users should not see each other's custom avatar.
- Fix:
  - Backend `GET /api/users/:id` now requires auth and returns custom avatar only for self or accepted friends.
  - Pending requests UI shows default avatar while request is pending.

6. **Online status showed offline for both users in friends list**
- Cause A: After accept, newly added friend was hardcoded to `isOnline: false` in frontend.
- Fix A: Included `sender.isOnline` in pending request payload and used it when adding friend locally.
- Cause B: Session restore (`/auth/me`) did not mark user online in DB.
- Fix B: `getMeController` now sets `isOnline = true` and returns updated user.

## Current status
- Core Issue #48 flow is working end-to-end after fixes.
- Lint passes on frontend and backend after each patch.
- PR is now focused on friend request UX + stabilization fixes discovered in manual QA.

---

# Issue #49 / PR #120 — User Search UI Review & Fixes

## Scope
Reviewed PR #120 against Issue #49 acceptance criteria and fixed all identified code issues.

## What we changed
- **`UserSearch.tsx`** — full rewrite (file had Windows CRLF line endings + mixed indentation making partial edits impossible):
  - Added magnifying glass SVG icon inside the input wrapper with `pl-9` offset on the input
  - Replaced `"Searching…"` text-only state with an animated `animate-spin` SVG spinner + label
  - Fixed `handleWrapperBlur(e: any)` → `React.FocusEvent<HTMLDivElement>`
  - Normalized to LF line endings and 2-space indentation
- **`Navbar.tsx`** — removed `// TEMP` markers around the `UserSearch` import; replaced commented-out `<div className="ml-2">` wrapper with a clean single-line `<UserSearch className="ml-2 w-64" />`
- **`frontend/src/services/users.service.ts`** — removed stale `// a tester URIComonent` debug comment; added trailing newline
- **`backend/src/controllers/users.controller.ts`** — added trailing newline
- **`backend/src/services/users.service.ts`** — added trailing newline
- **PR description** — corrected to `Closes #49` (was incorrectly set to `Closes #62`)

## Issues encountered
- Edit tool failed on `UserSearch.tsx` due to CRLF line endings — solved by rewriting the file entirely with Write tool
- `git push` rejected (remote was 1 commit ahead) — resolved with `git pull --rebase`, conflict in `UserSearch.tsx` resolved by writing clean version, then `git rebase --continue`

---

# Issues #54–57 / PR #119 — Chat System Review, Bug Fixes & Polish

## Scope
Reviewed PR #119 against all four linked issue acceptance criteria, then resolved a series of bugs found in code review and manual QA.

## Round 1 — Review gap: 300ms typing debounce (Issue #55)
- **Bug**: `typing: true` was emitted immediately on the first keystroke instead of after a 300ms debounce as specified in the issue
- **Fix** (`MessageInput.tsx`): Added `typingStartTimeoutRef` to delay the initial `typing: true` emit by 300ms. The 3s inactivity stop timeout cancels the pending start if it hasn't fired yet. `handleSend` also clears both timeouts and the typing flag before sending.

## Round 2 — High-severity reviewer findings

### 1. Wrong conversation identity for first outbound message (`ConversationList.tsx`)
- **Bug**: For new outbound conversations, `partnerInfo` was set to `msg.sender` (always the current user) in both branches of a ternary — self data was used instead of the partner's.
- **Fix**: Detected new outbound conversations by checking `conversationsRef` (see below) before calling `setConversations`. If it's a new outbound conv, trigger an API refetch and return early. The `setConversations` updater is left as a pure transformation with no side effects.

### 2. Infinite scroll broken by unconditional auto-scroll (`MessageThread.tsx`)
- **Bug**: Every `messages` state update (including prepends from infinite scroll) triggered `scrollToBottom()`, jumping the user back to the bottom while reading old messages.
- **Fix**: Added `isPrependRef` and `prevScrollHeightRef`. In `loadMore`, snapshot `scrollHeight` before prepending and set the prepend flag. `useLayoutEffect` restores the exact scroll position after render (before paint). The `useEffect` for auto-scroll skips when `isPrependRef.current` is true.

## Round 3 — Critical bug report: real-time messages silently dropped

### 1. Socket payload shape mismatch — root cause of all real-time failures (`chat.service.ts`)
- **Bug**: `getMessageWithSender` returned `ReceiveMessagePayload` (flat: `senderUsername`, `senderAvatar`, `timestamp`) but the frontend `MessageWithSender` type expected a nested `sender` object, `createdAt`, `receiverId`, and `read`. Because `receiverId` was `undefined` in the socket payload, the filter in `MessageThread` always evaluated false and silently dropped every real-time message.
- **Fix**: Changed return type to `MessageWithSender` with correct field names: `receiverId`, `createdAt`, `read`, and nested `sender: { username, avatarUrl }`.

### 2. No error feedback when message fails (`MessageInput.tsx`)
- **Bug**: The `message_error` socket event was emitted by the backend but never listened to on the frontend.
- **Fix**: Added `useEffect` with a `message_error` socket listener that sets the `error` state, surfacing backend rejection messages (invalid content, not friends, etc.) in the UI.

### 3. Socket reconnecting on every render (`SocketContext.tsx`)
- **Bug**: `useEffect` dependency was `[user]` (object reference), causing the socket to disconnect and reconnect on every re-render that produced a new `user` object reference.
- **Fix**: Changed dependency to `[userId]` (stable `number | null` primitive).

## Round 4 — Final reviewer findings

### 1. Side-effect inside `setState` updater (`ConversationList.tsx`)
- **Bug**: Used a mutable outer variable (`isNewOutbound`) set inside `setConversations` and read outside — a side effect in a pure updater, brittle under React 18 concurrent rendering / Strict Mode double-invocation.
- **Fix**: Added `conversationsRef = useRef(conversations)` with `conversationsRef.current = conversations` on every render. The `receive_message` handler checks the ref BEFORE deciding whether to call `setConversations`. The updater itself is now a pure transformation with no side effects.

### 2. Unused state lint warning (`Game.tsx`)
- **Fix**: Removed unused `const [showChat, setShowChat] = useState(false); // Later`

---

# Avatar Persistence & Fallback Fixes

## Root cause
`docker-compose.yml` did not mount `backend/uploads/` as a bind volume. Uploaded avatar files lived only in the container's ephemeral layer. Any container rebuild or restart wiped them, leaving the DB with stale `/uploads/avatars/...` paths that returned 404. The `backend/uploads/avatars/` directory already existed on the host.

## What we changed
- **`docker-compose.yml`** — added `- ./backend/uploads:/app/uploads:z` to the backend service volumes. Files now persist across container rebuilds.
- **`onError` fallback** added to all 6 avatar `<img>` elements (`Navbar` ×2, `Profile`, `FriendsList`, `ConversationItem`, `MessageBubble`) — if the image URL 404s, the browser gracefully falls back to `/default-avatar.png`.

**Note**: Any avatars uploaded before this fix were lost when the container was last rebuilt. Users need to re-upload their profile pictures once.

---

# Chat Widget UX Improvements

## Fix 1 — Typing indicator cut off (`MessageThread.tsx`)
- **Bug**: `scrollToBottom()` was only triggered by `messages` state changes. When `typingUser` changed from `null` → a name, no scroll occurred and the indicator appeared below the viewport.
- **Fix**: Added a dedicated `useEffect` that calls `scrollToBottom()` whenever `typingUser` becomes truthy.

## Fix 2 — Real-time unread badge on chat bubble (`ChatContext.tsx`, `ChatWidget.tsx`)
- **Requirement**: When a message arrives while the widget is closed, the floating chat button should show a live unread count badge.
- **Implementation**:
  - Added `totalUnread: number` to `ChatContext`
  - On login (`user?.id` dep): fetches `/api/messages/conversations` and sums all `unreadCount` values for the initial badge count
  - Socket listener for `receive_message` in `ChatProvider`: uses `isOpenRef` mirror pattern to check current open state without re-registering on every render. Only increments when the message is inbound and the widget is closed.
  - `openWidget` and `openChat` both reset `totalUnread = 0`
  - `ChatWidget` floating button: added `relative` class, rendered a red `absolute -top-1 -right-1` badge when `!isOpen && totalUnread > 0`, capped display at `99+`
