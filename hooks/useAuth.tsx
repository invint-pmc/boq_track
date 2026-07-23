"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export type AppRole = "Admin" | "Manager";

export interface AuthedUser {
  email: string;
  full_name: string | null;
  role: AppRole;
}

export type AuthStatus = "loading" | "unauthenticated" | "denied" | "authorized";

interface AuthContextValue {
  status: AuthStatus;
  user: AuthedUser | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthedUser | null>(null);

  const resolveAuthorization = useCallback(async (email: string | undefined | null) => {
    if (!email) {
      setUser(null);
      setStatus("unauthenticated");
      return;
    }

    const { data, error } = await supabase
      .from("authorized_users")
      .select("email, full_name, role, active")
      .eq("email", email)
      .maybeSingle();

    if (error || !data || !data.active) {
      setUser(null);
      setStatus("denied");
      return;
    }

    setUser({ email: data.email, full_name: data.full_name, role: data.role as AppRole });
    setStatus("authorized");
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      resolveAuthorization(data.session?.user?.email);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      resolveAuthorization(session?.user?.email);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [resolveAuthorization]);

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setStatus("unauthenticated");
  }

  return <AuthContext.Provider value={{ status, user, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
