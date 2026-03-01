import { useRef, useState } from "react";
import { useSocket } from "../../context/SocketContext";

interface MessageInputProps {
  receiverId: number;
}

export function MessageInput({ receiverId }: MessageInputProps) {
  const { socket } = useSocket();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingStartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const MAX_LENGTH = 2000;

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || !socket) return;
    if (trimmed.length > MAX_LENGTH) {
      setError(`Message too long (${trimmed.length}/${MAX_LENGTH})`);
      return;
    }

    // Cancel any pending start-typing debounce and stop typing indicator
    if (typingStartTimeoutRef.current) {
      clearTimeout(typingStartTimeoutRef.current);
      typingStartTimeoutRef.current = null;
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (isTypingRef.current) {
      socket.emit("typing", { receiverId, isTyping: false });
      isTypingRef.current = false;
    }

    socket.emit("send_message", { receiverId, content: trimmed });
    setMessage("");
    setError(null);
    // Refocus for next message
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setMessage(val);

    if (val.length > MAX_LENGTH) {
      setError(`Message too long (${val.length}/${MAX_LENGTH})`);
    } else {
      setError(null);
    }

    if (!socket) return;

    // Schedule typing: true after 300ms debounce (only if not already typing)
    if (!isTypingRef.current && !typingStartTimeoutRef.current) {
      typingStartTimeoutRef.current = setTimeout(() => {
        socket.emit("typing", { receiverId, isTyping: true });
        isTypingRef.current = true;
        typingStartTimeoutRef.current = null;
      }, 300);
    }

    // Reset the 3-second inactivity timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      // Cancel pending start-typing if it hasn't fired yet
      if (typingStartTimeoutRef.current) {
        clearTimeout(typingStartTimeoutRef.current);
        typingStartTimeoutRef.current = null;
      }
      if (isTypingRef.current) {
        socket.emit("typing", { receiverId, isTyping: false });
        isTypingRef.current = false;
      }
    }, 3000);
  };

  const isSendDisabled = !message.trim() || message.length > MAX_LENGTH;

  return (
    <div className="border-t border-black/10 px-4 py-3 flex flex-col gap-1">
      {error && (
        <p className="text-xs text-red-500 px-1">{error}</p>
      )}
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 resize-none rounded-xl border border-black/10 bg-white/10 px-3 py-2 text-sm text-pong-text placeholder:text-pong-text/40 focus:outline-none focus:ring-1 focus:ring-pong-accent max-h-28 overflow-y-auto"
          style={{ fieldSizing: "content" } as React.CSSProperties}
        />
        <button
          onClick={handleSend}
          disabled={isSendDisabled}
          className="flex-shrink-0 rounded-xl bg-pong-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default MessageInput;
