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
}

export function computeDashboardTotals(rows: BoqItemProgress[]): DashboardTotals {
  const totalBoqValue = rows.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalQty = rows.reduce((sum, r) => sum + (r.boq_qty || 0), 0);
  const deliveredQty = rows.reduce((sum, r) => sum + (r.delivered_qty || 0), 0);
  const installedQty = rows.reduce((sum, r) => sum + (r.installed_qty || 0), 0);
  const storedQty = rows.reduce((sum, r) => sum + (r.stored_qty || 0), 0);
  const billedQty = rows.reduce((sum, r) => sum + (r.billed_qty || 0), 0);
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
