# PR Review Notes: Real-Time Chat Reliability in React

## Context
A PR introduced a Socket.io-powered chat widget with conversation list, typing indicators, and paginated message history.

## Defect 1: Scroll Jump During History Pagination
### Symptom
When users scrolled up to load older messages, the thread snapped back to bottom.

### Why it happened
A single auto-scroll effect reacted to every `messages` update, regardless of whether data was appended (new live messages) or prepended (history page).

### Fix strategy
- Mark prepend operations with a ref.
- Capture `scrollHeight` before prepend.
- After render (`useLayoutEffect`), restore anchor position by adjusting `scrollTop`.
- Skip bottom auto-scroll when processing prepend updates.

## Defect 2: Incorrect Partner Identity on First Outbound Message
### Symptom
New conversation rows could show incorrect user identity when initiated by the current user.

### Why it happened
Socket payload included sender info but not complete receiver profile data. UI logic attempted to synthesize conversation rows from incomplete payloads.

### Fix strategy
- Detect first outbound conversation case.
- Trigger conversation summary refetch and avoid constructing malformed rows.

## Engineering Takeaways
- Treat append and prepend as distinct state transitions.
- Keep state updaters pure; avoid side effects inside updater functions.
- Validate payload shape assumptions before deriving UI entities.
- Prefer deterministic verification: lint + focused regression tests + manual two-user realtime flow.
