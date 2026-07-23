"use client";

import { X } from "lucide-react";
import { useBoqHistory, type HistoryRow } from "@/hooks/useBoqHistory";
import type { BoqItemProgress } from "@/lib/types";
import type { EntryType } from "@/lib/types";
import { TagChip } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { formatQty } from "@/lib/calculations";

const SECTIONS: { type: EntryType; label: string }[] = [
  { type: "Delivery", label: "Deliveries" },
  { type: "Invoice", label: "Invoices" },
  { type: "Installation", label: "Installations" },
  { type: "Stored", label: "Stored Entries" },
];

export default function HistoryPanel({ item, onClose }: { item: BoqItemProgress; onClose: () => void }) {
  const { history, loading, error } = useBoqHistory(item.boq_item_id);

  const grouped: Record<EntryType, HistoryRow[]> = {
    Delivery: [],
    Invoice: [],
    Installation: [],
    Stored: [],
  };
  history.forEach((h) => {
    if (grouped[h.entry_type as EntryType]) grouped[h.entry_type as EntryType].push(h);
  });

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink/20" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface h-full shadow-panel border-l border-border flex flex-col">
        <div className="flex items-start justify-between px-5 py-4 border-b border-border">
          <div>
            <TagChip>{item.boq_number}</TagChip>
            <div className="font-display font-medium text-ink mt-2 leading-snug">{item.description}</div>
            <div className="text-xs text-ink-faint mt-1">
              {item.category_name} · Unit: {item.unit}
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-paper text-ink-soft" aria-label="Close history panel">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 px-5 py-3 border-b border-border text-center">
          <div>
            <div className="text-[11px] text-ink-faint">BOQ Qty</div>
            <div className="font-mono text-sm font-medium text-ink">{formatQty(item.boq_qty)}</div>
          </div>
          <div>
            <div className="text-[11px] text-ink-faint">Delivered</div>
            <div className="font-mono text-sm font-medium text-blueprint">{formatQty(item.delivered_qty)}</div>
          </div>
          <div>
            <div className="text-[11px] text-ink-faint">Installed</div>
            <div className="font-mono text-sm font-medium text-moss">{formatQty(item.installed_qty)}</div>
          </div>
          <div>
            <div className="text-[11px] text-ink-faint">Billed</div>
            <div className="font-mono text-sm font-medium text-rust">{formatQty(item.billed_qty)}</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && <div className="text-sm text-ink-soft">Loading history…</div>}
          {error && <div className="text-sm text-danger">{error}</div>}
          {!loading && history.length === 0 && (
            <div className="text-sm text-ink-faint">No transactions recorded yet for this item.</div>
          )}

          {!loading &&
            history.length > 0 &&
            SECTIONS.map(({ type, label }) => {
              const rows = grouped[type];
              if (rows.length === 0) return null;
              return (
                <div key={type} className="mb-5 last:mb-0">
                  <div className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-2">{label}</div>
                  <ul className="space-y-2">
                    {rows.map((h) => (
                      <li key={h.id} className="border border-border rounded p-3">
                        <div className="flex items-center justify-between">
                          <TagChip>{h.document_number}</TagChip>
                          <span className="text-xs text-ink-faint">{formatDate(h.entry_date)}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-xs text-ink-faint truncate">{h.vendor || "—"}</span>
                          <span className="font-mono text-sm text-ink">
                            {formatQty(h.quantity)} {item.unit}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
