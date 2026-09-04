"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { clearSession, readSession, saveSession } from "@/services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const router = useRouter();
  const [session, setSession] = useState(() => readSession());
  const [ready, setReady] = useState(true);

  const login = useCallback(async (payload) => {
    const data = await authService.login(payload);
    saveSession(data);
    setSession(data);
    router.push("/dashboard");
  }, [router]);

  const registerSchool = useCallback(async (payload) => {
    const data = await authService.registerSchool(payload);
    saveSession(data);
    setSession(data);
    router.push("/dashboard");
  }, [router]);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
    router.push("/login");
  }, [router]);

  const value = useMemo(
    () => ({
      ready,
      session,
      user: session?.user || null,
      school: session?.school || null,
      isAuthenticated: Boolean(session?.token),
      isAdmin: ["SUPER_ADMIN", "SCHOOL_ADMIN"].includes(session?.user?.role),
      login,
      registerSchool,
      logout
    }),
    [ready, session, login, registerSchool, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
