"use client";

import { useState } from "react";
import { DatabaseZap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";

export default function SetupRequired({ onRetry }: { onRetry: () => void | Promise<void> }) {
  const [checking, setChecking] = useState(false);

  async function handleRetry() {
    setChecking(true);
    try {
      await onRetry();
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-lg bg-surface border border-border rounded-md shadow-card p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-10 h-10 rounded bg-rust flex items-center justify-center mb-3">
            <DatabaseZap className="w-5 h-5 text-white" strokeWidth={2.25} />
          </div>
          <div className="font-display font-semibold text-lg text-ink">Database Not Initialized</div>
          <p className="text-sm text-ink-soft mt-2">
            The application connected to Supabase successfully, but the required tables don&apos;t exist yet.
            The database migrations in <code className="text-xs bg-paper px-1 py-0.5 rounded">supabase/migrations/</code> haven&apos;t
            been applied to this project.
          </p>
        </div>

        <div className="bg-paper border border-border rounded p-4 text-sm text-ink space-y-3">
          <div className="font-medium">To fix this, run the migrations once:</div>
          <pre className="bg-ink text-paper text-xs rounded p-3 overflow-x-auto leading-relaxed">
{`npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase db push`}
          </pre>
          <p className="text-ink-soft text-xs">
            See the <span className="font-medium">Database setup</span> section of the project README for the
            full walkthrough, including how to set this up as an automatic step in CI so it never has to be done
            by hand again.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={handleRetry}
          disabled={checking}
          className="w-full justify-center mt-6"
        >
          <RefreshCw className={checking ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
          {checking ? "Checking…" : "I've run the migrations — recheck"}
        </Button>
      </div>
    </div>
  );
}
