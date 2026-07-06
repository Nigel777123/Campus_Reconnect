import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User } from "../types";
import { api } from "../api";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Bootstrap from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("cr_token");
    const storedUser = localStorage.getItem("cr_user");
    if (stored && storedUser) {
      try {
        setToken(stored);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("cr_token");
        localStorage.removeItem("cr_user");
      }
    }
    setLoading(false);
  }, []);

  const saveSession = (token: string, user: User) => {
    localStorage.setItem("cr_token", token);
    localStorage.setItem("cr_user", JSON.stringify(user));
    setToken(token);
    setUser(user);
  };

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.auth.login(email, password);
    saveSession(data.token, data.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const data = await api.auth.register(name, email, password);
    saveSession(data.token, data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("cr_token");
    localStorage.removeItem("cr_user");
    setToken(null);
    setUser(null);
  }, []);

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
