# How we caught a subtle chat UX bug in PR review (React + Socket.io)

We reviewed a chat widget PR and found a subtle issue: infinite scroll looked implemented, but the thread kept jumping to bottom whenever older messages were loaded.

Root cause:
- `useEffect(() => scrollToBottom(), [messages])` ran for both append and prepend.
- Loading older messages prepended data, which triggered the same auto-scroll logic.

Fix pattern:
- Track whether the update is a prepend (`isPrependRef`).
- Snapshot previous scroll height before prepend.
- In `useLayoutEffect`, restore `scrollTop` using `newHeight - oldHeight`.
- Only auto-scroll for initial load / appended messages.

Second bug we caught:
- Conversation list built a new outbound row from socket payload that lacked receiver profile fields.
- Safer behavior: refetch conversation summaries for first outbound message instead of synthesizing malformed data.

Takeaway:
- In real-time UIs, "works visually once" is not enough. Test state transitions (append vs prepend) and payload shape assumptions explicitly.
