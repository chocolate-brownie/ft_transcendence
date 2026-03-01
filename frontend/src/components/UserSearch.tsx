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
    void navigate(`/profile/${user.id}`);
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

  function handleWrapperBlur(e: React.FocusEvent<HTMLDivElement>) {
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
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pong-text/40"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          id="search-users"
          name="search-users"
          aria-label="Search users"
          type="text"
          className="w-full rounded-lg border border-black/10 bg-white/70 pl-9 pr-3 py-2 text-sm shadow-sm outline-none"
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
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute left-0 right-0 mt-2 rounded-lg border border-black/10 bg-white/95 shadow-lg"
          onMouseDown={(e) => e.preventDefault()}
        >
          {/* Loading */}
          {loading && (
            <div className="flex items-center gap-2 px-3 py-2">
              <svg
                className="h-4 w-4 animate-spin text-pong-text/40"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth={4}
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span className="text-sm text-pong-text/60">Searching…</span>
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
          {!loading && !error && results.length === 0 && query.trim() !== "" && (
            <div className="px-3 py-2 text-sm text-pong-text/50">
              No users found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
