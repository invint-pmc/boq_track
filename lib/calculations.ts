import type { BoqItemProgress } from "@/lib/types";

/** Percentage helper — guards against divide-by-zero. */
export function pct(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

export type BoqStatus =
  | "Not Started"
  | "Delivered"
  | "Installed"
  | "Partially Installed"
  | "Partially Delivered"
  | "Completed";

/** Derives a single human-readable status for a BOQ row from its progress. */
export function deriveStatus(row: BoqItemProgress): BoqStatus {
  const { boq_qty, delivered_qty, installed_qty } = row;
  if (installed_qty >= boq_qty && boq_qty > 0) return "Completed";
  if (installed_qty > 0) return "Partially Installed";
  if (delivered_qty >= boq_qty && boq_qty > 0) return "Delivered";
  if (delivered_qty > 0) return "Partially Delivered";
  return "Not Started";
}

export interface DashboardTotals {
  totalBoqValue: number;
  deliveredPct: number;
  installedPct: number;
  storedPct: number;
  billedPct: number;
  pendingInstallationQty: number;
  pendingDeliveryQty: number;
  /** Delivered Qty minus Invoiced (billed) Qty, floored at 0. New KPI — Feature 4. */
  pendingInvoiceQty: number;
  /** Delivered Amount (delivered_qty x rate, summed) minus total Invoice Amount, floored at 0. New KPI — Feature 4. */
  pendingInvoiceAmount: number;
}

/**
 * @param totalInvoiceAmount Sum of entry_header.invoice_amount across all
 * Invoice documents. Passed in separately because invoice_amount lives on
 * entry_header (one value per document), not on boq_item_progress.
 * Existing dashboard calculations above are unchanged; this only adds the
 * two new KPIs from Feature 4.
 */
export function computeDashboardTotals(rows: BoqItemProgress[], totalInvoiceAmount = 0): DashboardTotals {
  const totalBoqValue = rows.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalQty = rows.reduce((sum, r) => sum + (r.boq_qty || 0), 0);
  const deliveredQty = rows.reduce((sum, r) => sum + (r.delivered_qty || 0), 0);
  const installedQty = rows.reduce((sum, r) => sum + (r.installed_qty || 0), 0);
  const storedQty = rows.reduce((sum, r) => sum + (r.stored_qty || 0), 0);
  const billedQty = rows.reduce((sum, r) => sum + (r.billed_qty || 0), 0);
  const deliveredAmount = rows.reduce((sum, r) => sum + (r.delivered_qty || 0) * (r.rate || 0), 0);
  const pendingInstallationQty = rows.reduce(
    (sum, r) => sum + Math.max(r.pending_installation_qty || 0, 0),
    0
  );
  const pendingDeliveryQty = rows.reduce(
    (sum, r) => sum + Math.max(r.pending_delivery_qty || 0, 0),
    0
  );

  return {
    totalBoqValue,
    deliveredPct: pct(deliveredQty, totalQty),
    installedPct: pct(installedQty, totalQty),
    storedPct: pct(storedQty, totalQty),
    billedPct: pct(billedQty, totalQty),
    pendingInstallationQty,
    pendingDeliveryQty,
    pendingInvoiceQty: Math.max(deliveredQty - billedQty, 0),
    pendingInvoiceAmount: Math.max(deliveredAmount - (totalInvoiceAmount || 0), 0),
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatQty(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(value || 0);
}
