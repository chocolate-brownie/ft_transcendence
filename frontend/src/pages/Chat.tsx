import { useState } from "react";
import { ConversationList } from "../components/Chat/ConversationList";
import { MessageThread } from "../components/Chat/MessageThread";
import { MessageInput } from "../components/Chat/MessageInput";

interface ActiveConversation {
  userId: number;
  username: string;
}

export default function Chat() {
  const [active, setActive] = useState<ActiveConversation | null>(null);

  const handleSelect = (userId: number, username: string) => {
    setActive({ userId, username });
  };

  return (
    <div className="flex w-full max-w-5xl h-[75vh] rounded-xl overflow-hidden border border-black/10 bg-white/5 backdrop-blur-sm shadow-lg">
      {/* Left — conversation list */}
      <div className="w-72 flex-shrink-0 border-r border-black/10 flex flex-col">
        <div className="px-4 py-3 border-b border-black/10">
          <h2 className="text-sm font-semibold text-pong-text/70 uppercase tracking-wide">
            Messages
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ConversationList
            activeUserId={active?.userId ?? null}
            onSelectConversation={handleSelect}
          />
        </div>
      </div>

      {/* Right — thread + input */}
      <div className="flex flex-col flex-1 min-w-0">
        {active ? (
          <>
            {/* Header */}
            <div className="px-4 py-3 border-b border-black/10 flex items-center gap-2">
              <span className="text-sm font-semibold text-pong-text">
                {active.username}
              </span>
            </div>
            <MessageThread
              otherUserId={active.userId}
              otherUsername={active.username}
            />
            <MessageInput receiverId={active.userId} />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-pong-text/30 text-sm italic">
              Select a conversation to start chatting
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
