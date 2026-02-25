import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User } from "../types";

// --- Types ---

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
};

// --- Context ---

const AuthContext = createContext<AuthContextType | null>(null);

// --- Provider ---

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On app mount: restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsLoading(false);
      return;
    }
    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          // Token is invalid or expired — clear it
          localStorage.removeItem("token");
          return null;
        }
        if (!res.ok) return null; // Transient server error — keep token, try again next load
        return res.json();
      })
      .then((data: { user: User } | null) => {
        if (data) setUser(data.user);
      })
      .catch(() => {}) // Network error — keep token, don't log out
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Login failed.");
    localStorage.setItem("token", data.token);
    setUser(data.user);
  };

  const signup = async (email: string, username: string, password: string) => {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Signup failed.");
    localStorage.setItem("token", data.token);
    setUser(data.user);
  };

  const logout = () => {
    const token = localStorage.getItem("token");
    localStorage.removeItem("token");
    setUser(null);
    // Tell the server to mark the user offline immediately instead of waiting
    // for the socket to disconnect on its own (which can take several seconds)
    if (token) {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {}); // best-effort — don't block the UI
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// --- Hook ---

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
