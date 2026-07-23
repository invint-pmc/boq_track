"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useDatabaseStatus } from "@/hooks/useDatabaseStatus";
import LoginScreen from "@/components/LoginScreen";
import AccessDenied from "@/components/AccessDenied";
import SetupRequired from "@/components/SetupRequired";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

// These render as their own full-screen pages regardless of auth status.
// Notably, clicking an emailed password-reset link establishes a temporary
// Supabase session — without this bypass that session would satisfy the
// "authorized" check below and jump straight to the dashboard instead of
// showing the reset-password form.
const STANDALONE_AUTH_ROUTES = ["/forgot-password", "/reset-password"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { status: dbStatus, recheck: recheckDb } = useDatabaseStatus();
  const { status, user } = useAuth();

  // Check database initialization BEFORE evaluating auth status at all.
  // Querying an uninitialized schema after login would otherwise look
  // just like "not authorized" (a denied/failed lookup on authorized_users),
  // which is misleading — the real issue is that migrations were never run.
  if (dbStatus === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="text-sm text-ink-soft">Loading…</div>
      </div>
    );
  }

  if (dbStatus === "not_initialized") {
    return <SetupRequired onRetry={recheckDb} />;
  }

  if (STANDALONE_AUTH_ROUTES.includes(pathname)) {
    return <>{children}</>;
  }

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
