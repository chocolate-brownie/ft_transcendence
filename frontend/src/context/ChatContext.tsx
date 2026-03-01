import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { useSocket } from "./SocketContext";
import { useAuth } from "./AuthContext";
import { apiClient } from "../lib/apiClient";
import type { ConversationSummary, MessageWithSender } from "../types";

interface ActiveConversation {
  userId: number;
  username: string;
}

interface ChatContextType {
  isOpen: boolean;
  active: ActiveConversation | null;
  totalUnread: number;
  openWidget: () => void;
  openChat: (userId: number, username: string) => void;
  closeWidget: () => void;
  setActive: (conv: ActiveConversation | null) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState<ActiveConversation | null>(null);
  const [totalUnread, setTotalUnread] = useState(0);

  // Mirror isOpen in a ref so the socket handler always reads the latest value
  // without needing to re-register on every open/close cycle.
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  // Initialize total unread from server whenever the user session starts
  useEffect(() => {
    if (!user) {
      setTotalUnread(0);
      return;
    }
    apiClient
      .get<ConversationSummary[]>("/api/messages/conversations")
      .then((convos) => setTotalUnread(convos.reduce((sum, c) => sum + c.unreadCount, 0)))
      .catch(() => {});
  }, [user]);

  // Real-time: increment badge only when a message arrives while the widget is closed
  useEffect(() => {
    if (!socket || !user) return;

    const handle = (msg: MessageWithSender) => {
      if (msg.senderId === user.id) return; // own outbound message — never counts
      if (!isOpenRef.current) {
        setTotalUnread((n) => n + 1);
      }
    };

    socket.on("receive_message", handle);
    return () => {
      socket.off("receive_message", handle);
    };
  }, [socket, user]);

  const openWidget = () => {
    // Intentionally preserve totalUnread here: opening the shell does not mean
    // the user has actually viewed a specific conversation.
    setIsOpen(true);
  };

  const openChat = (userId: number, username: string) => {
    setActive({ userId, username });
    setIsOpen(true);
    setTotalUnread(0);
  };

  const closeWidget = () => {
    setIsOpen(false);
    setActive(null);
  };

  return (
    <ChatContext.Provider value={{ isOpen, active, totalUnread, openWidget, openChat, closeWidget, setActive }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used inside <ChatProvider>");
  return ctx;
}
