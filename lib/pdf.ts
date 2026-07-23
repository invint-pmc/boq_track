import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDate } from "@/lib/utils";
import { formatCurrency } from "@/lib/calculations";
import type { DocumentWithLines } from "@/hooks/useDocuments";

export function exportDocumentToPdf(doc: DocumentWithLines) {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });

  pdf.setFontSize(14);
  pdf.text(`${doc.entry_type} — ${doc.document_number}`, 40, 44);

  pdf.setFontSize(10);
  const headerLines = [
    `Date: ${formatDate(doc.entry_date)}`,
    `Vendor: ${doc.vendor || "—"}`,
    `Remarks: ${doc.remarks || "—"}`,
    ...(doc.entry_type === "Invoice" ? [`Invoice Amount: ${formatCurrency(doc.invoice_amount || 0)}`] : []),
  ];
  headerLines.forEach((line, i) => pdf.text(line, 40, 66 + i * 16));

  autoTable(pdf, {
    startY: 66 + headerLines.length * 16 + 12,
    head: [["BOQ Number", "Description", "Unit", "Quantity"]],
    body: doc.lines.map((l) => [l.boq_number, l.description, l.unit, String(l.quantity)]),
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [31, 95, 168] },
    theme: "grid",
  });

  pdf.save(`${doc.entry_type}_${doc.document_number}.pdf`);
}
