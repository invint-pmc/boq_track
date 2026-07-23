"use client";

import { useState } from "react";
import Link from "next/link";
import { Ruler, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { supabase, setRememberMe } from "@/lib/supabase/client";
import { Button } from "@/components/ui";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setSigningIn(true);
    setError(null);
    try {
      // Must be set before signInWithPassword writes the session, so the
      // token lands in the right storage (localStorage vs sessionStorage).
      setRememberMe(remember);

      const { error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (err) throw err;
      // On success, the auth state change listener in AuthProvider picks
      // up the new session and AppShell re-renders past this screen —
      // nothing else to do here.
    } catch (e: any) {
      setError(e?.message === "Invalid login credentials" ? "Incorrect email or password." : e?.message || "Could not sign in. Please try again.");
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm bg-surface border border-border rounded-md shadow-card p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-10 h-10 rounded bg-blueprint flex items-center justify-center mb-3">
            <Ruler className="w-5 h-5 text-white" strokeWidth={2.25} />
          </div>
          <div className="font-display font-semibold text-lg text-ink">BOQ Tracker</div>
          <div className="text-sm text-ink-soft mt-1">Sign in to your account</div>
        </div>

        <form onSubmit={handleLogin} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                autoFocus
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full pl-9 pr-3 py-2 rounded border border-border bg-surface text-sm focus-visible:outline-blueprint"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-9 py-2 rounded border border-border bg-surface text-sm focus-visible:outline-blueprint"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-soft"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-sm text-ink-soft cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded border-border focus-visible:outline-blueprint"
              />
              Remember Me
            </label>
            <Link href="/forgot-password" className="text-sm text-blueprint hover:text-blueprint-dark font-medium">
              Forgot Password?
            </Link>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button type="submit" disabled={signingIn} className="w-full justify-center">
            {signingIn ? "Signing in…" : "Login"}
          </Button>
        </form>
      </div>
    </div>
  );
}
