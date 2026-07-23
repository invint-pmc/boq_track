"use client";

import { useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, CheckCircle2, Plus, ShieldAlert } from "lucide-react";
import { useBoqProgress } from "@/hooks/useBoqProgress";
import { useDefaultProject } from "@/hooks/useDefaultProject";
import { useAuth } from "@/hooks/useAuth";
import { isAdmin } from "@/lib/permissions";
import BoqSearchDialog from "@/components/BoqSearchDialog";
import EntryGrid from "@/components/EntryGrid";
import { Button } from "@/components/ui";
import { entryHeaderSchema, type EntryHeaderFormValues } from "@/lib/schemas";
import { supabase } from "@/lib/supabase/client";
import { todayISO } from "@/lib/utils";
import type { EntryType, BoqItemProgress } from "@/lib/types";

const ENTRY_TYPES: EntryType[] = ["Delivery", "Invoice", "Installation", "Stored"];

const DOCUMENT_LABEL: Record<EntryType, { label: string; placeholder: string }> = {
  Delivery: { label: "DC Number", placeholder: "e.g. DC-1042" },
  Invoice: { label: "Invoice Number", placeholder: "e.g. INV-2201" },
  Installation: { label: "Installation Ref", placeholder: "e.g. INST-0087" },
  Stored: { label: "Stored Ref", placeholder: "e.g. STORE-0032" },
};

export default function UniversalEntryPage() {
  const { user } = useAuth();
  const { rows, categories, loading } = useBoqProgress();
  const { projectId } = useDefaultProject();
  const [searchOpen, setSearchOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<EntryHeaderFormValues>({
    resolver: zodResolver(entryHeaderSchema),
    defaultValues: {
      entry_type: "Delivery",
      entry_date: todayISO(),
      document_number: "",
      vendor: "",
      remarks: "",
      rows: [],
    },
  });

  const fieldArray = useFieldArray({ control, name: "rows" });
  const entryType = watch("entry_type");
  const watchedRows = watch("rows");

  const boqLookup = useMemo(() => new Map(rows.map((r) => [r.boq_item_id, r])), [rows]);
  const addedIds = useMemo(() => new Set(watchedRows.map((r) => r.boq_item_id)), [watchedRows]);

  function handleAddItem(item: BoqItemProgress) {
    const existingIndex = fieldArray.fields.findIndex((f) => f.boq_item_id === item.boq_item_id);
    if (existingIndex !== -1) {
      // Already on the grid — just focus its quantity field instead of duplicating the row.
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
    });
    const newIndex = fieldArray.fields.length;
    requestAnimationFrame(() => {
      const input = document.querySelector<HTMLInputElement>(`[data-quantity-index="${newIndex}"]`);
      input?.focus();
      input?.select();
    });
  }

  async function onSubmit(values: EntryHeaderFormValues) {
    if (!projectId) {
      setSaveError("No project found. Import a BOQ first.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSavedMessage(null);
    try {
      const { data: header, error: headerErr } = await supabase
        .from("entry_header")
        .insert({
          project_id: projectId,
          entry_type: values.entry_type,
          entry_date: values.entry_date,
          document_number: values.document_number,
          vendor: values.vendor || null,
          remarks: values.remarks || null,
        })
        .select()
        .single();

      if (headerErr) throw headerErr;

      const detailPayload = values.rows.map((r) => ({
        entry_header_id: header.id,
        boq_item_id: r.boq_item_id,
        quantity: r.quantity,
      }));

      const { error: detailsErr } = await supabase.from("entry_details").insert(detailPayload);
      if (detailsErr) throw detailsErr;

      setSavedMessage(`${values.entry_type} document ${values.document_number} saved with ${detailPayload.length} rows.`);
      reset({
        entry_type: values.entry_type,
        entry_date: todayISO(),
        document_number: "",
        vendor: "",
        remarks: "",
        rows: [],
      });
    } catch (e: any) {
      setSaveError(e?.message || "Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display font-semibold text-xl text-ink">Universal Entry</h1>
        <p className="text-sm text-ink-soft mt-0.5">
          Log a Delivery, Invoice, Installation or Stored transaction against any BOQ items.
        </p>
      </div>

      {!isAdmin(user?.role) ? (
        <div className="bg-surface border border-border rounded-md p-10 text-center">
          <ShieldAlert className="w-8 h-8 text-rust mx-auto mb-3" />
          <div className="font-display font-medium text-ink mb-1">Read-only access</div>
          <div className="text-sm text-ink-soft max-w-sm mx-auto">
            Managers cannot create, edit, or delete entries. Ask an Admin to log this transaction.
          </div>
        </div>
      ) : (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-surface border border-border rounded-md p-5 shadow-card space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1">Entry Type</label>
              <select {...register("entry_type")} className="w-full px-3 py-2 rounded border border-border bg-surface text-sm">
                {ENTRY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1">Date</label>
              <input type="date" {...register("entry_date")} className="w-full px-3 py-2 rounded border border-border bg-surface text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1">
                {DOCUMENT_LABEL[entryType].label}
              </label>
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
        </div>

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

        {saveError && <p className="text-sm text-danger">{saveError}</p>}
        {savedMessage && (
          <p className="text-sm text-moss flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> {savedMessage}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={saving || loading}>
            <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
      )}

      {searchOpen && isAdmin(user?.role) && (
        <BoqSearchDialog
          items={rows}
          categories={categories}
          addedIds={addedIds}
          onAdd={handleAddItem}
          onClose={() => setSearchOpen(false)}
        />
      )}
    </div>
  );
}
