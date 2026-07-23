"use client";

import { useRef, useState } from "react";
import { X, Upload, Download } from "lucide-react";
import { parseBoqExcelFile, downloadBoqImportTemplate, type ParsedBoqRow } from "@/lib/excel";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui";
import type { Category } from "@/lib/types";

export default function ImportBoqDialog({
  projectId,
  categories,
  onClose,
  onImported,
}: {
  projectId: string;
  categories: Category[];
  onClose: () => void;
  onImported: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedBoqRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryByName = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));

  async function handleFile(file: File) {
    setError(null);
    setFileName(file.name);
    try {
      const parsed = await parseBoqExcelFile(file);
      setRows(parsed);
    } catch (e: any) {
      setError(e?.message || "Could not read that file. Confirm it's a valid .xlsx export.");
    }
  }

  async function handleImport() {
    if (rows.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const payload = rows.map((r) => ({
        project_id: projectId,
        category_id: categoryByName.get(r.category.toLowerCase()) || null,
        boq_number: r.boqNumber,
        description: r.description,
        unit: r.unit,
        boq_qty: r.boqQty,
        rate: r.rate,
        amount: r.amount,
      }));

      const { error: err } = await supabase
        .from("boq_items")
        .upsert(payload, { onConflict: "project_id,boq_number" });

      if (err) throw err;
      onImported();
      onClose();
    } catch (e: any) {
      setError(e?.message || "Import failed. Check the file matches the expected columns.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} />
      <div className="relative bg-surface rounded-md shadow-panel border border-border w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="font-display font-medium text-ink">Import BOQ from Excel</div>
          <button onClick={onClose} className="p-1 rounded hover:bg-paper text-ink-soft" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto">
          <p className="text-sm text-ink-soft">
            Upload a .xlsx file with columns: BOQ Number, Category, Description, Unit, BOQ Qty, Rate, Amount.
            Existing BOQ numbers are updated in place; new numbers are added.
          </p>

          <button
            type="button"
            onClick={() => downloadBoqImportTemplate()}
            className="text-sm text-blueprint hover:underline inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Download template
          </button>

          <div
            className="border-2 border-dashed border-border rounded-md p-6 text-center cursor-pointer hover:border-blueprint/50"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-5 h-5 mx-auto text-ink-faint mb-2" />
            <div className="text-sm text-ink-soft">{fileName ? fileName : "Click to choose a .xlsx file"}</div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>

          {error && <div className="text-sm text-danger">{error}</div>}

          {rows.length > 0 && (
            <div className="border border-border rounded overflow-hidden">
              <div className="px-3 py-2 bg-paper text-xs font-medium text-ink-soft border-b border-border">
                {rows.length} rows detected
              </div>
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-paper text-ink-faint">
                    <tr>
                      <th className="px-3 py-1.5 text-left">BOQ No.</th>
                      <th className="px-3 py-1.5 text-left">Description</th>
                      <th className="px-3 py-1.5 text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 50).map((r, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-3 py-1.5 font-mono">{r.boqNumber}</td>
                        <td className="px-3 py-1.5 truncate max-w-[220px]">{r.description}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{r.boqQty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-border flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={rows.length === 0 || saving}>
            {saving ? "Importing…" : `Import ${rows.length || ""} rows`.trim()}
          </Button>
        </div>
      </div>
    </div>
  );
}
