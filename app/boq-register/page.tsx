"use client";

import { useMemo, useState } from "react";
import { Search, FileSpreadsheet, Upload } from "lucide-react";
import { useBoqProgress } from "@/hooks/useBoqProgress";
import { useDefaultProject } from "@/hooks/useDefaultProject";
import { useAuth } from "@/hooks/useAuth";
import { isAdmin } from "@/lib/permissions";
import BoqRegisterTable from "@/components/BoqRegisterTable";
import HistoryPanel from "@/components/HistoryPanel";
import ImportBoqDialog from "@/components/ImportBoqDialog";
import { Button } from "@/components/ui";
import { exportBoqRegisterToExcel } from "@/lib/excel";
import type { BoqItemProgress } from "@/lib/types";

export default function BoqRegisterPage() {
  const { user } = useAuth();
  const { rows, categories, loading, error, refresh } = useBoqProgress();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selected, setSelected] = useState<BoqItemProgress | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchesCategory = categoryFilter === "All" || r.category_name === categoryFilter;
      const term = search.trim().toLowerCase();
      const matchesSearch =
        !term ||
        r.boq_number.toLowerCase().includes(term) ||
        r.description.toLowerCase().includes(term) ||
        (r.category_name || "").toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [rows, search, categoryFilter]);

  const { projectId } = useDefaultProject();

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-semibold text-xl text-ink">BOQ Register</h1>
          <p className="text-sm text-ink-soft mt-0.5">Every BOQ item with live delivery, installation, storage and billing progress.</p>
        </div>
        <div className="flex gap-2">
          {isAdmin(user?.role) && (
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              <Upload className="w-4 h-4" /> Import Excel
            </Button>
          )}
          <Button variant="secondary" onClick={() => exportBoqRegisterToExcel(filtered)}>
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search BOQ number, description or category…"
            className="w-full pl-9 pr-3 py-2 rounded border border-border bg-surface text-sm focus-visible:outline-blueprint"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded border border-border bg-surface text-sm min-w-[160px]"
        >
          <option value="All">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="text-xs text-ink-faint ml-auto">{filtered.length} of {rows.length} items</div>
      </div>

      {loading && <div className="text-sm text-ink-soft">Loading BOQ register…</div>}
      {error && <div className="text-sm text-danger">{error}</div>}
      {!loading && !error && <BoqRegisterTable rows={filtered} onRowClick={setSelected} />}

      {selected && <HistoryPanel item={selected} onClose={() => setSelected(null)} />}

      {importOpen && isAdmin(user?.role) && (
        <ImportBoqDialog
          projectId={projectId || ""}
          categories={categories}
          onClose={() => setImportOpen(false)}
          onImported={refresh}
        />
      )}
    </div>
  );
}
