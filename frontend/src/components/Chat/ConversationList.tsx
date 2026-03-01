import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { apiClient } from "../../lib/apiClient";
import type { ConversationSummary, MessageWithSender } from "../../types";
import { ConversationItem } from "./ConversationItem";

interface ConversationListProps {
  activeUserId: number | null;
  onSelectConversation: (userId: number, username: string) => void;
}

export function ConversationList({ activeUserId, onSelectConversation }: ConversationListProps) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mirror conversations state in a ref so socket handlers can read the current
  // value without being added to effect dependency arrays (which would cause
  // the listener to re-register on every message).
  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;

  // Initial fetch
  useEffect(() => {
    apiClient
      .get<ConversationSummary[]>("/api/messages/conversations")
      .then(setConversations)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  // Real-time: update list when a new message arrives
  useEffect(() => {
    if (!socket || !user) return;

    const handleReceiveMessage = (msg: MessageWithSender) => {
      const partnerId = msg.senderId === user.id ? msg.receiverId : msg.senderId;

      // New outbound conversation: msg.sender is the current user, not the partner.
      // We have no receiver profile in the socket payload — refetch to get the
      // correct partner row instead of building a malformed one.
      // Read from the ref (not closure state) so this check is always fresh.
      if (msg.senderId === user.id && !conversationsRef.current.find((c) => c.user.id === partnerId)) {
        apiClient
          .get<ConversationSummary[]>("/api/messages/conversations")
          .then(setConversations)
          .catch(console.error);
        return;
      }

      // Pure updater — no side effects, no mutable outer variables
      setConversations((prev) => {
        const existing = prev.find((c) => c.user.id === partnerId);
        // msg.sender is the remote partner for all inbound messages
        const partnerInfo = msg.sender;

        const updatedConv: ConversationSummary = existing
          ? {
              ...existing,
              lastMessage: {
                content: msg.content,
                createdAt: msg.createdAt,
                senderId: msg.senderId,
              },
              // Increment unread only if this conversation is not currently open
              unreadCount:
                msg.senderId !== user.id && partnerId !== activeUserId
                  ? existing.unreadCount + 1
                  : existing.unreadCount,
            }
          : {
              // New inbound conversation — sender data is the partner
              user: {
                id: partnerId,
                username: partnerInfo.username,
                displayName: null,
                avatarUrl: partnerInfo.avatarUrl,
                isOnline: true,
              },
              lastMessage: {
                content: msg.content,
                createdAt: msg.createdAt,
                senderId: msg.senderId,
              },
              unreadCount: 1,
            };

        // Move to top, remove old entry if existed
        return [updatedConv, ...prev.filter((c) => c.user.id !== partnerId)];
      });
    };

    socket.on("receive_message", handleReceiveMessage);
    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [socket, user, activeUserId]);

  // Clear unread count when a conversation is opened
  const handleSelect = (conv: ConversationSummary) => {
    setConversations((prev) =>
      prev.map((c) => (c.user.id === conv.user.id ? { ...c, unreadCount: 0 } : c)),
    );
    onSelectConversation(conv.user.id, conv.user.displayName ?? conv.user.username);
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-8">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-pong-accent border-t-transparent" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-pong-text/40 italic">
        No messages yet. Start a conversation with a friend!
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 p-2 overflow-y-auto">
      {conversations.map((conv) => (
        <ConversationItem
          key={conv.user.id}
          conversation={conv}
          isActive={conv.user.id === activeUserId}
          currentUserId={user?.id ?? -1}
          onClick={() => handleSelect(conv)}
        />
      ))}
    </div>
  );
}

export default ConversationList;
