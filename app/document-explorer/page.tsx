"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useDocuments, fetchDocumentDetail, EMPTY_DOCUMENT_FILTERS, type DocumentWithLines, type DocumentFilters } from "@/hooks/useDocuments";
import { useBoqProgress } from "@/hooks/useBoqProgress";
import { useAuth } from "@/hooks/useAuth";
import { isAdmin } from "@/lib/permissions";
import { supabase } from "@/lib/supabase/client";
import DocumentDetail from "@/components/DocumentDetail";
import EntryFormDialog from "@/components/EntryFormDialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import { TagChip, EmptyState } from "@/components/ui";
import { formatDate, cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/calculations";
import type { EntryType } from "@/lib/types";

const ENTRY_TYPES: EntryType[] = ["Delivery", "Invoice", "Installation", "Stored"];

const TYPE_COLORS: Record<string, string> = {
  Delivery: "text-blueprint",
  Invoice: "text-rust",
  Installation: "text-moss",
  Stored: "text-ink-soft",
};

export default function DocumentExplorerPage() {
  const { user } = useAuth();
  const canManage = isAdmin(user?.role);
  const [filters, setFilters] = useState<DocumentFilters>(EMPTY_DOCUMENT_FILTERS);
  const { documents, loading, error, refresh: refreshDocuments } = useDocuments(filters);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DocumentWithLines | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // "all" so a document referencing an archived BOQ item can still be edited.
  const { rows: allBoqRows, categories } = useBoqProgress("all");

  function refreshDetail() {
    if (!selectedId) return;
    setDetailLoading(true);
    fetchDocumentDetail(selectedId).then((d) => {
      setDetail(d);
      setDetailLoading(false);
    });
  }

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let active = true;
    setDetailLoading(true);
    fetchDocumentDetail(selectedId).then((d) => {
      if (!active) return;
      setDetail(d);
      setDetailLoading(false);
    });
    return () => {
      active = false;
    };
  }, [selectedId]);

  useEffect(() => {
    if (documents.length > 0 && !documents.some((d) => d.id === selectedId)) {
      setSelectedId(documents[0].id);
    }
    if (documents.length === 0) {
      setSelectedId(null);
    }
  }, [documents, selectedId]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display font-semibold text-xl text-ink">Document Explorer</h1>
        <p className="text-sm text-ink-soft mt-0.5">Look up any Delivery, Invoice, Installation or Stored document.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 print:block">
        <div className="space-y-3 print:hidden">
          <div className="relative">
            <Search className="w-4 h-4 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={filters.documentNumber}
              onChange={(e) => setFilters((f) => ({ ...f, documentNumber: e.target.value }))}
              placeholder="Search DC or Invoice number…"
              className="w-full pl-9 pr-3 py-2 rounded border border-border bg-surface text-sm focus-visible:outline-blueprint"
            />
          </div>

          <input
            value={filters.vendor}
            onChange={(e) => setFilters((f) => ({ ...f, vendor: e.target.value }))}
            placeholder="Filter by vendor…"
            className="w-full px-3 py-2 rounded border border-border bg-surface text-sm focus-visible:outline-blueprint"
          />

          <select
            value={filters.entryType}
            onChange={(e) => setFilters((f) => ({ ...f, entryType: e.target.value as DocumentFilters["entryType"] }))}
            className="w-full px-3 py-2 rounded border border-border bg-surface text-sm"
          >
            <option value="All">All Document Types</option>
            {ENTRY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-ink-faint mb-1">From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                className="w-full px-2 py-1.5 rounded border border-border bg-surface text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-ink-faint mb-1">To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
                className="w-full px-2 py-1.5 rounded border border-border bg-surface text-xs"
              />
            </div>
          </div>

          <div className="border border-border rounded-md bg-surface shadow-card max-h-[55vh] overflow-y-auto">
            {loading && <div className="px-4 py-6 text-sm text-ink-soft">Loading documents…</div>}
            {error && <div className="px-4 py-6 text-sm text-danger">{error}</div>}
            {!loading && documents.length === 0 && (
              <div className="px-4 py-6 text-sm text-ink-faint">No documents match these filters.</div>
            )}
            <ul>
              {documents.map((doc) => (
                <li key={doc.id}>
                  <button
                    onClick={() => setSelectedId(doc.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-paper",
                      selectedId === doc.id && "bg-blueprint-light/50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-semibold uppercase tracking-wide ${TYPE_COLORS[doc.entry_type] || "text-ink"}`}>
                        {doc.entry_type}
                      </span>
                      <span className="text-xs text-ink-faint">{formatDate(doc.entry_date)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <TagChip>{doc.document_number}</TagChip>
                      {doc.entry_type === "Invoice" && doc.invoice_amount != null && (
                        <span className="text-[11px] font-mono text-rust">{formatCurrency(doc.invoice_amount)}</span>
                      )}
                    </div>
                    {doc.vendor && <div className="text-xs text-ink-faint mt-1 truncate">{doc.vendor}</div>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          {detailLoading && <div className="text-sm text-ink-soft">Loading document…</div>}
          {!detailLoading && detail && (
            <DocumentDetail
              doc={detail}
              canManage={canManage}
              onEdit={() => setEditOpen(true)}
              onDelete={() => setDeleteOpen(true)}
            />
          )}
          {!detailLoading && !detail && (
            <EmptyState title="No document selected" description="Search or filter, then pick a document from the list." />
          )}
        </div>
      </div>

      {editOpen && detail && canManage && (
        <EntryFormDialog
          doc={detail}
          boqRows={allBoqRows}
          categories={categories}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            refreshDetail();
            refreshDocuments();
          }}
        />
      )}

      {deleteOpen && detail && canManage && (
        <ConfirmDialog
          title="Delete this entry?"
          description="This action cannot be undone."
          confirmLabel="Delete"
          confirmVariant="danger"
          onClose={() => setDeleteOpen(false)}
          onConfirm={async () => {
            const { error: err } = await supabase.from("entry_header").delete().eq("id", detail.id);
            if (err) throw err;
            setSelectedId(null);
            refreshDocuments();
          }}
        />
      )}
    </div>
  );
}
