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
