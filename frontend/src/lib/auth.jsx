import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = loading, false = not logged in, obj = admin
  useEffect(() => {
    api.get("/auth/me").then((r) => setUser(r.data)).catch(() => setUser(false));
  }, []);
  const login = async (email, password) => {
    const r = await api.post("/auth/login", { email, password });
    localStorage.setItem("refixion_token", r.data.access_token);
    setUser(r.data.user);
    return r.data.user;
  };
  const logout = async () => {
    try { await api.post("/auth/logout"); } catch (e) {}
    localStorage.removeItem("refixion_token");
    setUser(false);
  };
  return <AuthCtx.Provider value={{ user, login, logout, setUser }}>{children}</AuthCtx.Provider>;
}
export const useAuth = () => useContext(AuthCtx);
