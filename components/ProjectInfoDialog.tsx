"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui";
import type { Project, ProjectStatus } from "@/lib/types";

const STATUS_OPTIONS: ProjectStatus[] = ["Planning", "Active", "On Hold", "Completed"];

export default function ProjectInfoDialog({
  project,
  onClose,
  onSaved,
}: {
  project: Project;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(project.name);
  const [clientName, setClientName] = useState(project.client_name || "");
  const [location, setLocation] = useState(project.location || "");
  const [startDate, setStartDate] = useState(project.start_date || "");
  const [status, setStatus] = useState<ProjectStatus>(project.status || "Active");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const { error: err } = await supabase
        .from("projects")
        .update({
          name: name.trim() || project.name,
          client_name: clientName.trim() || null,
          location: location.trim() || null,
          start_date: startDate || null,
          status,
        })
        .eq("id", project.id);
      if (err) throw err;
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e?.message || "Could not save project details.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} />
      <div className="relative bg-surface rounded-md shadow-panel border border-border w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="font-display font-medium text-ink">Project Information</div>
          <button onClick={onClose} className="p-1 rounded hover:bg-paper text-ink-soft" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1">Project Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded border border-border bg-surface text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1">Client Name</label>
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-3 py-2 rounded border border-border bg-surface text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 rounded border border-border bg-surface text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded border border-border bg-surface text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full px-3 py-2 rounded border border-border bg-surface text-sm"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>

        <div className="px-5 py-4 border-t border-border flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
