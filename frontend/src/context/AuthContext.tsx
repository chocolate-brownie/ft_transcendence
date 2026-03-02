import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User } from "../types";
import { authService } from "../services/auth.service";
import { ApiError } from "../lib/apiClient";

// --- Types ---

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (patch: Partial<User>) => void;
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
    authService
      .me()
      .then((data) => setUser(data.user))
      .catch((err) => {
        if (err instanceof ApiError && (err.status === 401 || err.status === 404)) {
          // 401 = token invalid/expired; 404 = account deleted — both mean clear the token
          localStorage.removeItem("token");
        }
        // Other errors: transient server error — keep token, try again next load
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const data = await authService.login(email, password);
    localStorage.setItem("token", data.token);
    setUser(data.user);
  };

  const signup = async (email: string, username: string, password: string) => {
    const data = await authService.signup(email, username, password);
    localStorage.setItem("token", data.token);
    setUser(data.user);
  };

  const updateUser = (patch: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const logout = () => {
    // Fire-and-forget logout — must be called before clearing localStorage
    // so apiClient can still read the token
    authService.logout();
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, updateUser }}>
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
