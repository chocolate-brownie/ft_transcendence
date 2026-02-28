import { createContext, useContext, useState, ReactNode } from "react";

interface ActiveConversation {
  userId: number;
  username: string;
}

interface ChatContextType {
  isOpen: boolean;
  active: ActiveConversation | null;
  openWidget: () => void;
  openChat: (userId: number, username: string) => void;
  closeWidget: () => void;
  setActive: (conv: ActiveConversation | null) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState<ActiveConversation | null>(null);

  const openWidget = () => setIsOpen(true);

  const openChat = (userId: number, username: string) => {
    setActive({ userId, username });
    setIsOpen(true);
  };

  const closeWidget = () => {
    setIsOpen(false);
    setActive(null);
  };

  return (
    <ChatContext.Provider value={{ isOpen, active, openWidget, openChat, closeWidget, setActive }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used inside <ChatProvider>");
  return ctx;
}
