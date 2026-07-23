"use client";

import { useState } from "react";
import { Pencil, LogOut } from "lucide-react";
import { useDefaultProject } from "@/hooks/useDefaultProject";
import { useAuth, type AuthedUser } from "@/hooks/useAuth";
import { isAdmin } from "@/lib/permissions";
import ProjectInfoDialog from "@/components/ProjectInfoDialog";
import { formatDate } from "@/lib/utils";

const STATUS_TONE: Record<string, string> = {
  Planning: "bg-paper text-ink-soft border-border",
  Active: "bg-moss-light text-moss border-moss/30",
  "On Hold": "bg-rust-light text-rust border-rust/30",
  Completed: "bg-blueprint-light text-blueprint-dark border-blueprint/20",
};

export default function Topbar({ user }: { user: AuthedUser }) {
  const { project, loading, refresh } = useDefaultProject();
  const { signOut } = useAuth();
  const [editing, setEditing] = useState(false);
  const canEditProject = isAdmin(user.role);

  return (
    <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-6 shrink-0 gap-4">
      <button
        onClick={() => canEditProject && project && setEditing(true)}
        className="group flex items-center gap-2 text-left min-w-0"
        disabled={!canEditProject || !project}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-display font-semibold text-ink text-[15px] truncate">
              {loading ? "Loading project…" : project?.name || "Default Project"}
            </span>
            {project && (
              <span
                className={`text-[11px] font-medium px-1.5 py-0.5 rounded border shrink-0 ${STATUS_TONE[project.status] || STATUS_TONE.Active}`}
              >
                {project.status}
              </span>
            )}
            {canEditProject && project && (
              <Pencil className="w-3 h-3 text-ink-faint opacity-0 group-hover:opacity-100 shrink-0" />
            )}
          </div>
          <div className="text-xs text-ink-faint truncate">
            {project?.client_name ? `${project.client_name} · ` : ""}
            {project?.location || "Execution tracking · not for accounting"}
          </div>
        </div>
      </button>

      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right hidden sm:block">
          <div className="text-sm text-ink font-medium leading-tight">{user.full_name || user.email}</div>
          <div className="text-[11px] text-ink-faint">{user.role}</div>
        </div>
        <div className="text-sm text-ink-soft font-mono hidden md:block">{formatDate(new Date())}</div>
        <button
          onClick={signOut}
          className="p-2 rounded hover:bg-paper text-ink-soft hover:text-ink"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {editing && project && (
        <ProjectInfoDialog project={project} onClose={() => setEditing(false)} onSaved={refresh} />
      )}
    </header>
  );
}
