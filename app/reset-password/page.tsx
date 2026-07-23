"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Ruler, Lock, CheckCircle2, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui";

type LinkState = "checking" | "valid" | "invalid";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [linkState, setLinkState] = useState<LinkState>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clicking the emailed reset link redirects here with a recovery token in
  // the URL. The shared Supabase client (detectSessionInUrl: true) parses
  // that automatically and establishes a temporary session — we just need
  // to wait for it before showing the form.
  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) setLinkState("valid");
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || session) setLinkState("valid");
    });

    // If no session shows up shortly, the link is missing/expired/already used.
    const timeout = setTimeout(() => {
      if (active) setLinkState((s) => (s === "checking" ? "invalid" : s));
    }, 3000);

    return () => {
      active = false;
      listener.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      setDone(true);
      // Force a fresh, explicit login with the new password rather than
      // silently continuing on the temporary recovery session.
      await supabase.auth.signOut();
      setTimeout(() => router.push("/"), 1800);
    } catch (e: any) {
      setError(e?.message || "Could not update your password. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm bg-surface border border-border rounded-md shadow-card p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-10 h-10 rounded bg-blueprint flex items-center justify-center mb-3">
            <Ruler className="w-5 h-5 text-white" strokeWidth={2.25} />
          </div>
          <div className="font-display font-semibold text-lg text-ink">Set a new password</div>
        </div>

        {linkState === "checking" && (
          <div className="text-center py-6 text-sm text-ink-soft">Verifying your reset link…</div>
        )}

        {linkState === "invalid" && (
          <div className="text-center py-4">
            <div className="font-medium text-ink text-sm">This link is invalid or has expired</div>
            <p className="text-sm text-ink-soft mt-1">Request a new password reset link and try again.</p>
            <Link href="/forgot-password">
              <Button variant="secondary" className="w-full justify-center mt-4">
                Request new link
              </Button>
            </Link>
          </div>
        )}

        {linkState === "valid" && done && (
          <div className="text-center py-4">
            <CheckCircle2 className="w-8 h-8 text-moss mx-auto mb-2" />
            <div className="font-medium text-ink text-sm">Password updated</div>
            <div className="text-sm text-ink-soft mt-1">Redirecting you to sign in…</div>
          </div>
        )}

        {linkState === "valid" && !done && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  autoFocus
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-9 pr-3 py-2 rounded border border-border bg-surface text-sm focus-visible:outline-blueprint"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1">Confirm New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full pl-9 pr-3 py-2 rounded border border-border bg-surface text-sm focus-visible:outline-blueprint"
                />
              </div>
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" disabled={saving} className="w-full justify-center">
              {saving ? "Updating…" : "Update Password"}
            </Button>
          </form>
        )}

        <Link href="/" className="mt-6 flex items-center justify-center gap-1.5 text-sm text-ink-soft hover:text-ink">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
