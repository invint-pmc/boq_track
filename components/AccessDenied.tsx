"use client";

import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui";

export default function AccessDenied() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm bg-surface border border-border rounded-md shadow-card p-8 text-center">
        <ShieldAlert className="w-9 h-9 text-danger mx-auto mb-3" />
        <div className="font-display font-semibold text-lg text-ink">Access Denied</div>
        <p className="text-sm text-ink-soft mt-2">Please contact your administrator.</p>
        <Button variant="secondary" onClick={signOut} className="w-full justify-center mt-6">
          Back to sign in
        </Button>
      </div>
    </div>
  );
}
