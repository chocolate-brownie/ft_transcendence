import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { apiClient } from "../../lib/apiClient";
import type { MessageWithSender, ChatHistoryResponse } from "../../types";
import { MessageBubble } from "./MessageBubble";

interface MessageThreadProps {
  otherUserId: number;
  otherUsername: string;
}

export function MessageThread({ otherUserId, otherUsername }: MessageThreadProps) {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [notFriend, setNotFriend] = useState(false);

  // Typing indicator state
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Tracks whether the next messages update is a prepend (load older) vs append (new message)
  const isPrependRef = useRef(false);
  const prevScrollHeightRef = useRef<number | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load initial chat history
  useEffect(() => {
    setIsLoading(true);
    setFetchError(false);
    setMessages([]);
    setNextCursor(null);

    apiClient
      .get<ChatHistoryResponse>(`/api/messages/${otherUserId}`)
      .then((data) => {
        // API returns newest-first; reverse for chronological display
        setMessages([...data.messages].reverse());
        setHasMore(data.hasMore);
        setNextCursor(data.nextCursor);
      })
      .catch(() => setFetchError(true))
      .finally(() => setIsLoading(false));
  }, [otherUserId]);

  // After a prepend, restore scroll position so the user stays at the same message
  useLayoutEffect(() => {
    if (prevScrollHeightRef.current !== null && scrollContainerRef.current) {
      const newScrollHeight = scrollContainerRef.current.scrollHeight;
      scrollContainerRef.current.scrollTop = newScrollHeight - prevScrollHeightRef.current;
      prevScrollHeightRef.current = null;
    }
  }, [messages]);

  // Scroll to bottom only on initial load and new (appended) messages — not after prepend
  useEffect(() => {
    if (!isLoading && !isPrependRef.current) scrollToBottom();
    isPrependRef.current = false;
  }, [messages, isLoading]);

  // Load older messages when scrolling to top
  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore || !nextCursor) return;

    // Snapshot scroll height before prepending so we can restore position after render
    isPrependRef.current = true;
    prevScrollHeightRef.current = scrollContainerRef.current?.scrollHeight ?? null;

    setIsLoadingMore(true);
    apiClient
      .get<ChatHistoryResponse>(`/api/messages/${otherUserId}?before=${nextCursor}`)
      .then((data) => {
        setMessages((prev) => [...[...data.messages].reverse(), ...prev]);
        setHasMore(data.hasMore);
        setNextCursor(data.nextCursor);
      })
      .catch((err) => {
        console.error(err);
        // Reset flags so a subsequent scroll doesn't accidentally suppress auto-scroll
        isPrependRef.current = false;
        prevScrollHeightRef.current = null;
      })
      .finally(() => setIsLoadingMore(false));
  }, [hasMore, isLoadingMore, nextCursor, otherUserId]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    if (el.scrollTop === 0) loadMore();
  }, [loadMore]);

  // Socket.io: incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (msg: MessageWithSender) => {
      // Only add if this message belongs to this conversation
      if (
        (msg.senderId === otherUserId && msg.receiverId === user?.id) ||
        (msg.senderId === user?.id && msg.receiverId === otherUserId)
      ) {
        setMessages((prev) => [...prev, msg]);

        // Mark as read in DB so unread badge doesn't reappear after refresh (#138)
        if (msg.senderId === otherUserId) {
          apiClient.patch(`/api/messages/${otherUserId}/read`).catch(() => {});
        }
      }
    };

    socket.on("receive_message", handleReceiveMessage);
    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [socket, otherUserId, user?.id]);

  // Socket.io: detect "not friends" error to show thread-level banner (#135)
  useEffect(() => {
    if (!socket) return;
    const handleMessageError = (err: { message: string }) => {
      if (err.message === "You can only send messages to friends") {
        setNotFriend(true);
      }
    };
    socket.on("message_error", handleMessageError);
    return () => {
      socket.off("message_error", handleMessageError);
    };
  }, [socket]);

  // Scroll to bottom when the typing indicator appears
  useEffect(() => {
    if (typingUser) scrollToBottom();
  }, [typingUser]);

  // Socket.io: typing indicator
  useEffect(() => {
    if (!socket) return;

    const handleUserTyping = (payload: { userId: number; username: string; isTyping: boolean }) => {
      if (payload.userId !== otherUserId) return;

      if (payload.isTyping) {
        setTypingUser(payload.username);
        // Auto-hide after 5 seconds as safety
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 5000);
      } else {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        setTypingUser(null);
      }
    };

    socket.on("user_typing", handleUserTyping);
    return () => {
      socket.off("user_typing", handleUserTyping);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [socket, otherUserId]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-pong-accent border-t-transparent" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm text-pong-text/60">Failed to load messages.</p>
        <button
          onClick={() => {
            setFetchError(false);
            setIsLoading(true);
            apiClient
              .get<ChatHistoryResponse>(`/api/messages/${otherUserId}`)
              .then((data) => {
                setMessages([...data.messages].reverse());
                setHasMore(data.hasMore);
                setNextCursor(data.nextCursor);
              })
              .catch(() => setFetchError(true))
              .finally(() => setIsLoading(false));
          }}
          className="rounded-lg bg-pong-accent px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 space-y-3"
      >
        {/* Load more indicator */}
        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-pong-accent border-t-transparent" />
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center h-full">
            <p className="text-pong-text/40 text-sm italic">
              No messages yet. Say hello to {otherUsername}!
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === user?.id}
            />
          ))
        )}

        {/* Not-friends banner — shown after a rejected send attempt (#135) */}
        {notFriend && (
          <div className="mx-1 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
            You are no longer friends — messaging is disabled.
          </div>
        )}

        {/* Typing indicator */}
        {typingUser && (
          <div className="flex items-center gap-2 px-1">
            <span className="text-sm italic text-pong-text/50">
              {typingUser} is typing
            </span>
            <span className="animate-pulse text-pong-text/50">...</span>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

export default MessageThread;
