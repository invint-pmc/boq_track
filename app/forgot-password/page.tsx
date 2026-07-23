"use client";

import { useState } from "react";
import Link from "next/link";
import { Ruler, Mail, CheckCircle2, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError(null);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined,
      });
      if (err) throw err;
      // Always show the same confirmation regardless of whether the email
      // is registered, so this form can't be used to enumerate accounts.
      setSent(true);
    } catch (e: any) {
      setError(e?.message || "Could not send the reset email. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm bg-surface border border-border rounded-md shadow-card p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-10 h-10 rounded bg-blueprint flex items-center justify-center mb-3">
            <Ruler className="w-5 h-5 text-white" strokeWidth={2.25} />
          </div>
          <div className="font-display font-semibold text-lg text-ink">Reset your password</div>
          <div className="text-sm text-ink-soft mt-1">
            Enter your email and we&apos;ll send you a link to set a new password.
          </div>
        </div>

        {sent ? (
          <div className="text-center py-4">
            <CheckCircle2 className="w-8 h-8 text-moss mx-auto mb-2" />
            <div className="font-medium text-ink text-sm">Check your email</div>
            <div className="text-sm text-ink-soft mt-1">
              If <span className="font-medium text-ink">{email}</span> has an account, a password reset link is on
              its way.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
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
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" disabled={sending} className="w-full justify-center">
              {sending ? "Sending…" : "Send Reset Link"}
            </Button>
          </form>
        )}

        <Link
          href="/"
          className="mt-6 flex items-center justify-center gap-1.5 text-sm text-ink-soft hover:text-ink"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
