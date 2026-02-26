import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [health, setHealth] = useState<"ok" | "error" | "loading">("loading");

  const handleLogout = () => {
    logout();
    void navigate("/");
  };

  const goTo = (path: string) => {
    setOpen(false);
    void navigate(path);
  };

  // Close dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, []);

  // For unauthenticated visitors: show basic system status in navbar
  useEffect(() => {
    if (user) return;
    let cancelled = false;
    setHealth("loading");
    fetch("/api/health")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(() => {
        if (!cancelled) setHealth("ok");
      })
      .catch(() => {
        if (!cancelled) setHealth("error");
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const avatarSrc =
    user?.avatarUrl?.startsWith("/uploads/")
      ? user.avatarUrl
      : user?.avatarUrl || "/default-avatar.png";

  const navLinks = [
    { label: "Play", to: "/game" },
    { label: "Tournaments", to: "/tournaments" },
    { label: "Leaderboard", to: "/leaderboard" },
  ];

  const isActive = (to: string) => location.pathname.startsWith(to);

  return (
    <nav className="flex items-center justify-between px-6 py-2 bg-pong-surface/70 backdrop-blur-md border-b border-white/5 sticky top-0 z-40">

      {/* Brand */}
      <Link to="/" className="flex items-center gap-2.5 group">
        <img src="/home.svg" alt="Grid Wars" className="h-4 w-4 object-contain" />
        <span className="text-base font-bold tracking-tight text-pong-text/90 group-hover:text-pong-accent transition-colors">
          Grid Wars
        </span>
      </Link>

      {user ? (
        <div className="flex items-center gap-1">
          {/* Nav links */}
          {navLinks.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              className={`relative px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                isActive(to)
                  ? "text-pong-accent bg-pong-accent/10"
                  : "text-pong-text/60 hover:text-pong-text/90 hover:bg-white/5"
              }`}
            >
              {label}
              {isActive(to) && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full bg-pong-accent" />
              )}
            </Link>
          ))}

          {/* Avatar dropdown */}
          <div className="relative ml-2" ref={menuRef}>
            <button
              onClick={() => setOpen((v) => !v)}
              type="button"
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 pl-1 pr-3 py-1 transition hover:bg-white/10 hover:border-white/20 focus:outline-none"
            >
              <div className="relative">
                <img
                  src={avatarSrc}
                  alt={`${user.username} avatar`}
                  className="h-7 w-7 rounded-full object-cover"
                />
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-pong-surface bg-green-400" />
              </div>
              <span className="text-sm font-medium text-pong-text/80">{user.username}</span>
              <svg
                className={`h-3 w-3 text-pong-text/40 transition-transform ${open ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-pong-surface/95 shadow-xl backdrop-blur-md z-50">
                {/* User header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                  <img src={avatarSrc} alt="" className="h-8 w-8 rounded-full object-cover" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-pong-text/90 truncate">{user.username}</p>
                    <p className="text-xs text-green-400">Online</p>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-pong-text/70 hover:bg-white/5 hover:text-pong-text/90 transition-colors"
                    onClick={() => goTo("/profile")}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                    Profile
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-pong-text/70 hover:bg-white/5 hover:text-pong-text/90 transition-colors"
                    onClick={() => goTo("/leaderboard")}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                    Leaderboard
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-white/5 py-1">
                  <button
                    onClick={() => { setOpen(false); handleLogout(); }}
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/5 hover:text-red-300 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {/* Health pill */}
          <span
            className={`hidden sm:flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              health === "ok"
                ? "bg-green-500/10 text-green-400"
                : health === "error"
                  ? "bg-red-500/10 text-red-400"
                  : "bg-yellow-500/10 text-yellow-400"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                health === "ok"
                  ? "bg-green-400"
                  : health === "error"
                    ? "bg-red-400"
                    : "bg-yellow-400 animate-pulse"
              }`}
            />
            {health === "ok" ? "Online" : health === "error" ? "Unavailable" : "Checking..."}
          </span>

          <Link
            to="/login"
            className="px-3 py-1.5 text-sm font-medium text-pong-text/70 hover:text-pong-text/90 transition-colors"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="px-3 py-1.5 text-sm font-medium rounded-md bg-pong-accent text-pong-background hover:bg-pong-accentDark transition-colors"
          >
            Sign up
          </Link>
        </div>
      )}
    </nav>
  );
}
