import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import { ConversationList } from "./ConversationList";
import { MessageThread } from "./MessageThread";
import { MessageInput } from "./MessageInput";

export function ChatWidget() {
  const { user } = useAuth();
  const { isOpen, active, openWidget, closeWidget, setActive } = useChat();

  if (!user) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 pointer-events-none">
      {/* Popup panel */}
      <div
        className={`flex flex-col w-80 h-[480px] rounded-2xl overflow-hidden border border-black/10 bg-pong-background shadow-2xl transition-all duration-200 origin-bottom-right pointer-events-auto ${
          isOpen
            ? "opacity-100 scale-100"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 bg-white/5 flex-shrink-0">
          {active ? (
            <button
              onClick={() => setActive(null)}
              className="flex items-center gap-1.5 text-pong-text/60 hover:text-pong-text transition text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-semibold text-pong-text truncate">{active.username}</span>
            </button>
          ) : (
            <span className="text-sm font-semibold text-pong-text">Messages</span>
          )}
          <button
            onClick={closeWidget}
            className="text-pong-text/40 hover:text-pong-text transition"
            aria-label="Close chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col flex-1 min-h-0">
          {active ? (
            <>
              <MessageThread otherUserId={active.userId} otherUsername={active.username} />
              <MessageInput receiverId={active.userId} />
            </>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <ConversationList
                activeUserId={null}
                onSelectConversation={(userId, username) => setActive({ userId, username })}
              />
            </div>
          )}
        </div>
      </div>

      {/* Floating toggle button */}
      <button
        onClick={isOpen ? closeWidget : openWidget}
        className="h-14 w-14 rounded-full bg-pong-accent shadow-lg flex items-center justify-center text-white transition hover:scale-105 active:scale-95 pointer-events-auto"
        aria-label="Toggle chat"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 16c0 1.1-.9 2-2 2H7l-4 4V6a2 2 0 012-2h14a2 2 0 012 2v10z" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default ChatWidget;
