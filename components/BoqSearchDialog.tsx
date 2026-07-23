"use client";

import { useMemo, useState } from "react";
import { X, Search, Plus, Check } from "lucide-react";
import type { BoqItemProgress, Category } from "@/lib/types";
import { TagChip, Button } from "@/components/ui";
import { formatQty } from "@/lib/calculations";

export default function BoqSearchDialog({
  items,
  categories,
  addedIds,
  onAdd,
  onClose,
}: {
  items: BoqItemProgress[];
  categories: Category[];
  addedIds: Set<string>;
  onAdd: (item: BoqItemProgress) => void;
  onClose: () => void;
}) {
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [term, setTerm] = useState("");

  const results = useMemo(() => {
    const t = term.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory = categoryFilter === "All" || item.category_name === categoryFilter;
      const matchesTerm =
        !t ||
        item.boq_number.toLowerCase().includes(t) ||
        item.description.toLowerCase().includes(t) ||
        (item.category_name || "").toLowerCase().includes(t);
      return matchesCategory && matchesTerm;
    });
  }, [items, categoryFilter, term]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} />
      <div className="relative bg-surface rounded-md shadow-panel border border-border w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="font-display font-medium text-ink">Add BOQ Item</div>
          <button onClick={onClose} className="p-1 rounded hover:bg-paper text-ink-soft" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3 border-b border-border">
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded border border-border bg-surface text-sm sm:w-52"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                autoFocus
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search BOQ number, description or category…"
                className="w-full pl-9 pr-3 py-2 rounded border border-border bg-surface text-sm focus-visible:outline-blueprint"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-paper sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-ink-soft">BOQ Number</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-ink-soft">Description</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-ink-soft">Category</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-ink-soft">Unit</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-ink-soft">BOQ Qty</th>
                <th className="px-3 py-2 w-20" />
              </tr>
            </thead>
            <tbody>
              {results.map((item) => {
                const added = addedIds.has(item.boq_item_id);
                return (
                  <tr key={item.boq_item_id} className="border-t border-border hover:bg-paper">
                    <td className="px-3 py-2">
                      <TagChip>{item.boq_number}</TagChip>
                    </td>
                    <td className="px-3 py-2 text-ink max-w-[240px] truncate">{item.description}</td>
                    <td className="px-3 py-2 text-ink-soft">{item.category_name}</td>
                    <td className="px-3 py-2 text-ink-soft">{item.unit}</td>
                    <td className="px-3 py-2 text-right font-mono">{formatQty(item.boq_qty)}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => onAdd(item)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blueprint-light text-blueprint-dark hover:bg-blueprint hover:text-white transition-colors"
                      >
                        {added ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        {added ? "Added" : "Add"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {results.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-ink-faint">
                    No BOQ items match your search or filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-4 border-t border-border flex justify-end">
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  );
}
