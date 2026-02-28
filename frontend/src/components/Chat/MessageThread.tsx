import { useEffect, useRef, useState, useCallback } from "react";
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
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Typing indicator state
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load initial chat history
  useEffect(() => {
    setIsLoading(true);
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
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [otherUserId]);

  // Scroll to bottom on initial load and when new messages arrive
  useEffect(() => {
    if (!isLoading) scrollToBottom();
  }, [messages, isLoading]);

  // Load older messages when scrolling to top
  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore || !nextCursor) return;

    setIsLoadingMore(true);
    apiClient
      .get<ChatHistoryResponse>(`/api/messages/${otherUserId}?before=${nextCursor}`)
      .then((data) => {
        setMessages((prev) => [...[...data.messages].reverse(), ...prev]);
        setHasMore(data.hasMore);
        setNextCursor(data.nextCursor);
      })
      .catch(console.error)
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
      }
    };

    socket.on("receive_message", handleReceiveMessage);
    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [socket, otherUserId, user?.id]);

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

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
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
