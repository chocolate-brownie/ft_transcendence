import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { User } from "../types";
import { usersService } from "../services/users.service";

type UserSearchProps = {
  className?: string;
};

export default function UserSearch({ className = "" }: UserSearchProps) {
  // ── State
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const navigate = useNavigate();

  // ── Fetch users
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const timeoutId = window.setTimeout(() => {
      void usersService
        .searchUsers(query)
        .then((data) => {
          setResults(data);
          setIsOpen(true);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Search failed");
          setResults([]);
          setIsOpen(true);
        })
        .finally(() => {
          setLoading(false);
        });
    }, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [query]);

  // ── Handlers
  function handleSelect(user: User) {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    navigate(`/profile/${user.id}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setIsOpen(false);
      setResults([]);
      setQuery("");
      e.currentTarget.blur();
    }
  }

  function renderResultItem(user: User) {
    return (
      <li
        key={user.id}
        className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded-md hover:bg-black/5 hover:shadow-sm transition-colors"
        onClick={() => handleSelect(user)}
      >
        <img
          src={user.avatarUrl ?? "/logo-friends.png"}
          alt={`${user.username} avatar`}
          className="h-8 w-8 rounded-full object-cover border border-black/10"
        />
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-pong-text">
            {user.displayName ?? user.username}
          </p>
          <p className="text-xs text-pong-text/50">@{user.username}</p>
        </div>
        <span
          className={
            "h-2.5 w-2.5 rounded-full " +
            (user.isOnline ? "bg-green-500" : "bg-gray-400")
          }
        />
      </li>
    );
  }

  function handleWrapperBlur(e: any) {
    const next = e.relatedTarget as Node | null;
    if (!next || !e.currentTarget.contains(next)) {
      setIsOpen(false);
      setResults([]);
      setQuery("");
    }
  }

  // ── Render
  return (
    <div
      className={`relative ${className}`}
      onBlur={handleWrapperBlur}
    >
      {/* Input */}
      <input
        type="text"
        className="w-full rounded-lg border border-black/10 bg-white/70 px-3 py-2 text-sm shadow-sm outline-none"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (results.length > 0 || error || query.trim() !== "") {
            setIsOpen(true);
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder="Search users..."
      />
      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 rounded-lg border border-black/10 bg-white/95 shadow-lg">
          {/* Loading */}
          {loading && (
            <div className="px-3 py-2 text-sm text-pong-text/60">
              Searching…
            </div>
          )}
          {/* Error */}
          {!loading && error && (
            <div className="px-3 py-2 text-sm text-red-500">{error}</div>
          )}
          {/* Results */}
          {!loading && !error && results.length > 0 && (
            <ul className="max-h-64 overflow-y-auto">
              {results.map(renderResultItem)}
            </ul>
          )}
          {/* No results */}
          {!loading &&
            !error &&
            results.length === 0 &&
            query.trim() !== "" && (
              <div className="px-3 py-2 text-sm text-pong-text/50">
                No users found.
              </div>
            )}
        </div>
      )}
    </div>
  );
}