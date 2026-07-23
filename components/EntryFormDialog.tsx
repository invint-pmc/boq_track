"use client";

import { useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Plus, X } from "lucide-react";
import BoqSearchDialog from "@/components/BoqSearchDialog";
import EntryGrid from "@/components/EntryGrid";
import { Button } from "@/components/ui";
import { entryHeaderSchema, type EntryHeaderFormValues } from "@/lib/schemas";
import { supabase } from "@/lib/supabase/client";
import type { DocumentWithLines } from "@/hooks/useDocuments";
import type { BoqItemProgress, Category, EntryType } from "@/lib/types";

const DOCUMENT_LABEL: Record<EntryType, { label: string; placeholder: string }> = {
  Delivery: { label: "DC Number", placeholder: "e.g. DC-1042" },
  Invoice: { label: "Invoice Number", placeholder: "e.g. INV-2201" },
  Installation: { label: "Installation Ref", placeholder: "e.g. INST-0087" },
  Stored: { label: "Stored Ref", placeholder: "e.g. STORE-0032" },
};

const PROGRESS_KEY: Record<EntryType, keyof BoqItemProgress> = {
  Delivery: "delivered_qty",
  Invoice: "billed_qty",
  Installation: "installed_qty",
  Stored: "stored_qty",
};

/**
 * Edit modal for an existing entry document (any of Delivery / Invoice /
 * Installation / Stored — all created through Universal Entry). Always
 * updates the existing entry_header row and reconciles entry_details by
 * id; it never inserts a new entry_header, so it can never create a
 * duplicate document.
 */
export default function EntryFormDialog({
  doc,
  boqRows,
  categories,
  onClose,
  onSaved,
}: {
  doc: DocumentWithLines;
  boqRows: BoqItemProgress[];
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const entryType = doc.entry_type as EntryType;
  const progressKey = PROGRESS_KEY[entryType];

  // This document's own quantities are already folded into boq_item_progress
  // (e.g. delivered_qty). Subtract them back out per BOQ item so the "would
  // exceed BOQ qty" warning in EntryGrid compares against *other* entries only,
  // not against this document's own — otherwise editing would double-count.
  const boqLookup = useMemo(() => {
    const ownQtyByItem = new Map<string, number>();
    doc.lines.forEach((l) => {
      ownQtyByItem.set(l.boq_item_id, (ownQtyByItem.get(l.boq_item_id) || 0) + Number(l.quantity || 0));
    });
    return new Map(
      boqRows.map((r) => {
        const own = ownQtyByItem.get(r.boq_item_id) || 0;
        if (!own) return [r.boq_item_id, r];
        return [r.boq_item_id, { ...r, [progressKey]: Number(r[progressKey] || 0) - own }];
      })
    );
  }, [boqRows, doc.lines, progressKey]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EntryHeaderFormValues>({
    resolver: zodResolver(entryHeaderSchema),
    defaultValues: {
      entry_type: entryType,
      entry_date: doc.entry_date,
      document_number: doc.document_number,
      vendor: doc.vendor || "",
      remarks: doc.remarks || "",
      invoice_amount: doc.invoice_amount ?? undefined,
      rows: doc.lines.map((l) => ({
        boq_item_id: l.boq_item_id,
        boq_number: l.boq_number,
        description: l.description,
        unit: l.unit,
        quantity: l.quantity,
        entry_detail_id: l.id,
      })),
    },
  });

  const fieldArray = useFieldArray({ control, name: "rows" });
  const watchedRows = watch("rows");
  const addedIds = useMemo(() => new Set(watchedRows.map((r) => r.boq_item_id)), [watchedRows]);

  function handleAddItem(item: BoqItemProgress) {
    const existingIndex = fieldArray.fields.findIndex((f) => f.boq_item_id === item.boq_item_id);
    if (existingIndex !== -1) {
      requestAnimationFrame(() => {
        const input = document.querySelector<HTMLInputElement>(`[data-quantity-index="${existingIndex}"]`);
        input?.focus();
        input?.select();
      });
      return;
    }
    fieldArray.append({
      boq_item_id: item.boq_item_id,
      boq_number: item.boq_number,
      description: item.description,
      unit: item.unit,
      quantity: 0,
      // No entry_detail_id — this is a new row, so it gets inserted on save.
    });
  }

  async function onSubmit(values: EntryHeaderFormValues) {
    setSaving(true);
    setFormError(null);
    try {
      // 1. Update the existing entry_header row in place — never insert a new one.
      const { error: headerErr } = await supabase
        .from("entry_header")
        .update({
          entry_date: values.entry_date,
          document_number: values.document_number,
          vendor: values.vendor || null,
          remarks: values.remarks || null,
          invoice_amount: entryType === "Invoice" ? values.invoice_amount ?? null : null,
        })
        .eq("id", doc.id);
      if (headerErr) throw headerErr;

      // 2. Reconcile entry_details: update rows that still exist, insert new
      //    rows, delete rows the user removed. Never duplicate a row.
      const originalIds = new Set(doc.lines.map((l) => l.id));
      const keptIds = new Set(values.rows.map((r) => r.entry_detail_id).filter(Boolean) as string[]);
      const toDelete = [...originalIds].filter((id) => !keptIds.has(id));

      const toUpdate = values.rows.filter((r) => r.entry_detail_id);
      const toInsert = values.rows.filter((r) => !r.entry_detail_id);

      if (toDelete.length > 0) {
        const { error: delErr } = await supabase.from("entry_details").delete().in("id", toDelete);
        if (delErr) throw delErr;
      }

      for (const row of toUpdate) {
        const { error: updErr } = await supabase
          .from("entry_details")
          .update({ boq_item_id: row.boq_item_id, quantity: row.quantity })
          .eq("id", row.entry_detail_id);
        if (updErr) throw updErr;
      }

      if (toInsert.length > 0) {
        const { error: insErr } = await supabase.from("entry_details").insert(
          toInsert.map((r) => ({
            entry_header_id: doc.id,
            boq_item_id: r.boq_item_id,
            quantity: r.quantity,
          }))
        );
        if (insErr) throw insErr;
      }

      onSaved();
      onClose();
    } catch (e: any) {
      setFormError(e?.message || "Could not save changes to this entry.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} />
      <div className="relative bg-surface rounded-md shadow-panel border border-border w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <div className="font-display font-medium text-ink">Edit {entryType} Entry</div>
            <div className="text-xs text-ink-faint mt-0.5">Updates the existing document — does not create a new one.</div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-paper text-ink-soft" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-5 py-4 space-y-4 overflow-y-auto">
            {/* entry_type is fixed once a document is created — participates in the form via a hidden field. */}
            <input type="hidden" {...register("entry_type")} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-ink-soft mb-1">Entry Type</label>
                <div className="w-full px-3 py-2 rounded border border-border bg-paper text-sm text-ink-soft">{entryType}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-soft mb-1">Date</label>
                <input type="date" {...register("entry_date")} className="w-full px-3 py-2 rounded border border-border bg-surface text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-soft mb-1">{DOCUMENT_LABEL[entryType].label}</label>
                <input
                  {...register("document_number")}
                  placeholder={DOCUMENT_LABEL[entryType].placeholder}
                  className="w-full px-3 py-2 rounded border border-border bg-surface text-sm font-mono"
                />
                {errors.document_number && <p className="text-xs text-danger mt-1">{errors.document_number.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-ink-soft mb-1">Vendor</label>
                <input {...register("vendor")} placeholder="Vendor / supplier name" className="w-full px-3 py-2 rounded border border-border bg-surface text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-soft mb-1">Remarks</label>
                <input {...register("remarks")} placeholder="Optional remarks" className="w-full px-3 py-2 rounded border border-border bg-surface text-sm" />
              </div>
            </div>

            {entryType === "Invoice" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-ink-soft mb-1">Invoice Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("invoice_amount")}
                    placeholder="e.g. 125000"
                    className="w-full px-3 py-2 rounded border border-border bg-surface text-sm font-mono"
                  />
                  {errors.invoice_amount && <p className="text-xs text-danger mt-1">{errors.invoice_amount.message}</p>}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-ink-soft">BOQ Items</label>
              <Button type="button" variant="secondary" onClick={() => setSearchOpen(true)}>
                <Plus className="w-4 h-4" /> Add Item
              </Button>
            </div>

            <EntryGrid
              fieldArray={fieldArray}
              register={register}
              entryType={entryType}
              boqLookup={boqLookup}
              quantities={watchedRows}
              onRemove={fieldArray.remove}
            />
            {errors.rows && <p className="text-xs text-danger">{errors.rows.message as string}</p>}
            {formError && <p className="text-sm text-danger">{formError}</p>}
          </div>

          <div className="px-5 py-4 border-t border-border flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>

      {searchOpen && (
        <BoqSearchDialog
          items={boqRows}
          categories={categories}
          addedIds={addedIds}
          onAdd={handleAddItem}
          onClose={() => setSearchOpen(false)}
        />
      )}
    </div>
  );
}
