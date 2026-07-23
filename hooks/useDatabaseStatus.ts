"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export type DbStatus = "checking" | "ready" | "not_initialized";

// PostgREST error codes/messages seen when a queried table doesn't exist yet.
// PGRST205 -> "Could not find the table '...' in the schema cache" (PostgREST's own check)
// 42P01    -> Postgres' native "undefined_table" SQLSTATE, in case it surfaces directly
function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "PGRST205" || error.code === "42P01") return true;
  return /schema cache|does not exist|relation .* does not exist/i.test(error.message || "");
}

/**
 * Checks whether the database schema (migrations) has actually been applied.
 *
 * This intentionally runs independently of authentication. Querying a table
 * that doesn't exist yet returns an error from PostgREST for ANY caller,
 * authenticated or not, before Row Level Security is ever evaluated — so
 * this check is meaningful even on the login screen, before a session
 * exists. An RLS policy blocking access to an EXISTING table returns success
 * with zero rows, not an error, so this never confuses "no permission" with
 * "no schema".
 *
 * `categories` is used as the canary table: it's small, seeded reference
 * data created in the very first migration, so its presence is a reliable
 * proxy for "the whole schema has been applied".
 */
export function useDatabaseStatus() {
  const [status, setStatus] = useState<DbStatus>("checking");
  const [lastError, setLastError] = useState<string | null>(null);

  const check = useCallback(async () => {
    setStatus("checking");
    setLastError(null);

    try {
      const { error } = await supabase.from("categories").select("id", { count: "exact", head: true });

      if (!error) {
        setStatus("ready");
        return;
      }

      if (isMissingTableError(error)) {
        setStatus("not_initialized");
        setLastError(error.message);
        return;
      }

      // Any other error (network blip, unexpected RLS/config issue, etc.)
      // is not evidence the schema is missing — don't block the whole app
      // on a false positive. Let auth/login proceed; the real error (if
      // any) will surface there.
      setStatus("ready");
    } catch (e: any) {
      // Network-level failure reaching Supabase at all — treat as ready
      // (not our call to make) so we don't mask a connectivity/env-var
      // problem behind a "run migrations" message.
      setStatus("ready");
      setLastError(e?.message ?? null);
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  return { status, lastError, recheck: check };
}
