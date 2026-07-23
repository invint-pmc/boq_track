import type { AppRole } from "@/hooks/useAuth";

/** Import BOQ, create/edit/delete entries, and modify Project Settings are Admin-only. Managers are read-only everywhere. */
export function isAdmin(role: AppRole | undefined | null): boolean {
  return role === "Admin";
}
