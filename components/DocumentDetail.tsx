"use client";

import { Printer, FileDown } from "lucide-react";
import type { DocumentWithLines } from "@/hooks/useDocuments";
import { Button, TagChip } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { formatQty } from "@/lib/calculations";
import { exportDocumentToPdf } from "@/lib/pdf";

const TYPE_COLORS: Record<string, string> = {
  Delivery: "text-blueprint",
  Invoice: "text-rust",
  Installation: "text-moss",
  Stored: "text-ink-soft",
};

export default function DocumentDetail({ doc }: { doc: DocumentWithLines }) {
  return (
    <div className="bg-surface border border-border rounded-md shadow-card">
      <div className="flex items-start justify-between px-5 py-4 border-b border-border print:hidden">
        <div>
          <span className={`text-xs font-semibold uppercase tracking-wide ${TYPE_COLORS[doc.entry_type] || "text-ink"}`}>
            {doc.entry_type}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <TagChip>{doc.document_number}</TagChip>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> Print
          </Button>
          <Button variant="secondary" onClick={() => exportDocumentToPdf(doc)}>
            <FileDown className="w-4 h-4" /> Export PDF
          </Button>
        </div>
      </div>

      <div id="document-print-area" className="px-5 py-4">
        <div className="hidden print:block mb-4">
          <div className="text-lg font-display font-semibold">{doc.entry_type} — {doc.document_number}</div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-5 text-sm">
          <div>
            <div className="text-xs text-ink-faint mb-0.5">Date</div>
            <div className="text-ink">{formatDate(doc.entry_date)}</div>
          </div>
          <div>
            <div className="text-xs text-ink-faint mb-0.5">Vendor</div>
            <div className="text-ink">{doc.vendor || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-ink-faint mb-0.5">Remarks</div>
            <div className="text-ink">{doc.remarks || "—"}</div>
          </div>
        </div>

        <div className="border border-border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-paper">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-ink-soft">BOQ Number</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-ink-soft">Description</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-ink-soft">Unit</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-ink-soft">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {doc.lines.map((line) => (
                <tr key={line.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <TagChip>{line.boq_number}</TagChip>
                  </td>
                  <td className="px-3 py-2 text-ink">{line.description}</td>
                  <td className="px-3 py-2 text-ink-soft">{line.unit}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatQty(line.quantity)}</td>
                </tr>
              ))}
              {doc.lines.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-ink-faint">
                    No line items on this document.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
