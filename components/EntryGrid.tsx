"use client";

import { Trash2, AlertTriangle } from "lucide-react";
import type { UseFieldArrayReturn, UseFormRegister } from "react-hook-form";
import type { EntryHeaderFormValues, EntryRowFormValues } from "@/lib/schemas";
import type { BoqItemProgress } from "@/lib/types";
import type { EntryType } from "@/lib/types";
import { TagChip } from "@/components/ui";

const PROGRESS_KEY: Record<EntryType, keyof BoqItemProgress> = {
  Delivery: "delivered_qty",
  Invoice: "billed_qty",
  Installation: "installed_qty",
  Stored: "stored_qty",
};

export default function EntryGrid({
  fieldArray,
  register,
  entryType,
  boqLookup,
  quantities,
  onRemove,
}: {
  fieldArray: UseFieldArrayReturn<EntryHeaderFormValues, "rows">;
  register: UseFormRegister<EntryHeaderFormValues>;
  entryType: EntryType;
  boqLookup: Map<string, BoqItemProgress>;
  quantities: EntryRowFormValues[];
  onRemove: (index: number) => void;
}) {
  const progressKey = PROGRESS_KEY[entryType];

  return (
    <div className="border border-border rounded-md overflow-hidden bg-surface shadow-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-paper">
          <tr>
            <th className="px-3 py-2.5 text-left text-xs font-medium text-ink-soft w-36">BOQ Number</th>
            <th className="px-3 py-2.5 text-left text-xs font-medium text-ink-soft">Description</th>
            <th className="px-3 py-2.5 text-left text-xs font-medium text-ink-soft w-32">Category</th>
            <th className="px-3 py-2.5 text-left text-xs font-medium text-ink-soft w-20">Unit</th>
            <th className="px-3 py-2.5 text-left text-xs font-medium text-ink-soft w-40">Quantity</th>
            <th className="px-3 py-2.5 w-10" />
          </tr>
        </thead>
        <tbody>
          {fieldArray.fields.map((field, index) => {
            const boq = boqLookup.get(field.boq_item_id);
            const existingQty = boq ? Number(boq[progressKey] || 0) : 0;
            const enteredQty = Number(quantities[index]?.quantity || 0);
            const boqQty = boq?.boq_qty ?? 0;
            const wouldExceed = boq ? existingQty + enteredQty > boqQty && boqQty > 0 : false;

            return (
              <tr key={field.id} className="border-t border-border">
                <td className="px-3 py-2">
                  <TagChip>{field.boq_number}</TagChip>
                </td>
                <td className="px-3 py-2 text-ink truncate max-w-[280px]">{field.description}</td>
                <td className="px-3 py-2 text-ink-soft">{boq?.category_name || "Uncategorized"}</td>
                <td className="px-3 py-2 text-ink-soft">{field.unit}</td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.01"
                    data-quantity-index={index}
                    {...register(`rows.${index}.quantity` as const)}
                    className="w-full px-2 py-1.5 rounded border border-border bg-surface font-mono text-sm focus-visible:outline-blueprint"
                  />
                  {wouldExceed && (
                    <div className="flex items-center gap-1 text-[11px] text-rust mt-1">
                      <AlertTriangle className="w-3 h-3" />
                      Exceeds BOQ qty ({boqQty}) — allowed, please confirm.
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="p-1.5 rounded hover:bg-danger-light text-ink-faint hover:text-danger"
                    aria-label="Remove row"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}
          {fieldArray.fields.length === 0 && (
            <tr>
              <td colSpan={6} className="px-3 py-10 text-center text-ink-faint">
                Click "Add Item" above to add the first row.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
