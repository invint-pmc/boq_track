"use client";

import { useAuth } from "@/hooks/useAuth";
import LoginScreen from "@/components/LoginScreen";
import AccessDenied from "@/components/AccessDenied";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuth();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="text-sm text-ink-soft">Loading…</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <LoginScreen />;
  }

  if (status === "denied" || !user) {
    return <AccessDenied />;
  }

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar role={user.role} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar user={user} />
        <main className="flex-1 min-w-0 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
