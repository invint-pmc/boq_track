"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui";
import { boqItemFormSchema, type BoqItemFormValues } from "@/lib/schemas";
import { formatCurrency } from "@/lib/calculations";
import type { BoqItemProgress, Category } from "@/lib/types";

/**
 * Add/Edit modal for a single BOQ item, saved directly into the
 * existing boq_items table. Used by both "+ Add BOQ" (item = null)
 * and the row-level Edit action (item = the row being edited).
 */
export default function BoqFormDialog({
  projectId,
  categories,
  item,
  onClose,
  onSaved,
}: {
  projectId: string;
  categories: Category[];
  item: BoqItemProgress | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!item;
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BoqItemFormValues>({
    resolver: zodResolver(boqItemFormSchema),
    defaultValues: {
      boq_number: item?.boq_number ?? "",
      category_id: item?.category_id ?? "",
      description: item?.description ?? "",
      unit: item?.unit ?? "Nos",
      boq_qty: item?.boq_qty ?? 0,
      rate: item?.rate ?? 0,
    },
  });

  const qty = Number(watch("boq_qty")) || 0;
  const rate = Number(watch("rate")) || 0;
  const amount = useMemo(() => qty * rate, [qty, rate]);

  async function onSubmit(values: BoqItemFormValues) {
    setSaving(true);
    setFormError(null);
    try {
      const boqNumber = values.boq_number.trim();

      // Duplicate BOQ Number check — case-insensitive, scoped to this
      // project, excluding the row currently being edited.
      let dupQuery = supabase
        .from("boq_items")
        .select("id")
        .eq("project_id", projectId)
        .ilike("boq_number", boqNumber);
      if (isEdit && item) {
        dupQuery = dupQuery.neq("id", item.boq_item_id);
      }
      const { data: dupRows, error: dupErr } = await dupQuery;
      if (dupErr) throw dupErr;
      if (dupRows && dupRows.length > 0) {
        setFormError(`A BOQ item with number "${boqNumber}" already exists.`);
        setSaving(false);
        return;
      }

      const payload = {
        project_id: projectId,
        category_id: values.category_id || null,
        boq_number: boqNumber,
        description: values.description.trim(),
        unit: values.unit.trim(),
        boq_qty: values.boq_qty,
        rate: values.rate,
        amount: values.boq_qty * values.rate,
      };

      if (isEdit && item) {
        const { error: updateErr } = await supabase
          .from("boq_items")
          .update(payload)
          .eq("id", item.boq_item_id);
        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await supabase.from("boq_items").insert(payload);
        if (insertErr) throw insertErr;
      }

      onSaved();
      onClose();
    } catch (e: any) {
      setFormError(e?.message || "Could not save this BOQ item.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} />
      <div className="relative bg-surface rounded-md shadow-panel border border-border w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="font-display font-medium text-ink">{isEdit ? "Edit BOQ Item" : "Add BOQ Item"}</div>
          <button onClick={onClose} className="p-1 rounded hover:bg-paper text-ink-soft" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-5 py-4 space-y-4 overflow-y-auto">
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1">BOQ Number</label>
              <input
                {...register("boq_number")}
                className="w-full px-3 py-2 rounded border border-border bg-surface text-sm focus-visible:outline-blueprint"
                placeholder="e.g. EX-001"
              />
              {errors.boq_number && <p className="text-xs text-danger mt-1">{errors.boq_number.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1">Category</label>
              <select
                {...register("category_id")}
                className="w-full px-3 py-2 rounded border border-border bg-surface text-sm focus-visible:outline-blueprint"
              >
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1">Description</label>
              <textarea
                {...register("description")}
                rows={2}
                className="w-full px-3 py-2 rounded border border-border bg-surface text-sm focus-visible:outline-blueprint"
                placeholder="Item description"
              />
              {errors.description && <p className="text-xs text-danger mt-1">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-ink-soft mb-1">Unit</label>
                <input
                  {...register("unit")}
                  className="w-full px-3 py-2 rounded border border-border bg-surface text-sm focus-visible:outline-blueprint"
                  placeholder="Nos"
                />
                {errors.unit && <p className="text-xs text-danger mt-1">{errors.unit.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-soft mb-1">BOQ Quantity</label>
                <input
                  type="number"
                  step="any"
                  {...register("boq_qty")}
                  className="w-full px-3 py-2 rounded border border-border bg-surface text-sm font-mono focus-visible:outline-blueprint"
                />
                {errors.boq_qty && <p className="text-xs text-danger mt-1">{errors.boq_qty.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-soft mb-1">Rate</label>
                <input
                  type="number"
                  step="any"
                  {...register("rate")}
                  className="w-full px-3 py-2 rounded border border-border bg-surface text-sm font-mono focus-visible:outline-blueprint"
                />
                {errors.rate && <p className="text-xs text-danger mt-1">{errors.rate.message}</p>}
              </div>
            </div>

            <div className="bg-paper rounded border border-border px-3 py-2 flex items-center justify-between">
              <span className="text-xs font-medium text-ink-soft uppercase tracking-wide">Amount</span>
              <span className="font-mono font-medium text-ink">{formatCurrency(amount)}</span>
            </div>

            {formError && <div className="text-sm text-danger">{formError}</div>}
          </div>

          <div className="px-5 py-4 border-t border-border flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Add BOQ"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
