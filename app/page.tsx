"use client";

import { useBoqProgress } from "@/hooks/useBoqProgress";
import { useTodayActivity } from "@/hooks/useTodayActivity";
import { useInvoiceTotals } from "@/hooks/useInvoiceTotals";
import { useDefaultProject } from "@/hooks/useDefaultProject";
import { computeDashboardTotals, formatCurrency, formatQty } from "@/lib/calculations";
import { StatCard } from "@/components/ui";
import { CategoryProgressChart, StatusDonut } from "@/components/DashboardCharts";
import { Wallet, Truck, Wrench, PackageCheck, Receipt, AlertTriangle, Clock, CalendarClock, FileText, ReceiptText } from "lucide-react";

export default function DashboardPage() {
  const { rows, loading, error } = useBoqProgress();
  const { deliveries, invoices } = useTodayActivity();
  const { projectId } = useDefaultProject();
  const { totalInvoiceAmount } = useInvoiceTotals(projectId);

  if (loading) {
    return <div className="text-sm text-ink-soft">Loading dashboard…</div>;
  }

  if (error) {
    return <div className="text-sm text-danger">{error}</div>;
  }

  if (rows.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-md p-10 text-center">
        <div className="font-display font-medium text-ink mb-1">No BOQ items yet</div>
        <div className="text-sm text-ink-soft">
          Import a BOQ from the BOQ Register page to start tracking delivery, installation and billing progress.
        </div>
      </div>
    );
  }

  const totals = computeDashboardTotals(rows, totalInvoiceAmount);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-semibold text-xl text-ink">Dashboard</h1>
        <p className="text-sm text-ink-soft mt-0.5">Live execution status across all BOQ items.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard label="Total BOQ Value" value={formatCurrency(totals.totalBoqValue)} icon={Wallet} tone="blueprint" />
        <StatCard label="Delivered" value={`${totals.deliveredPct}%`} icon={Truck} />
        <StatCard label="Installed" value={`${totals.installedPct}%`} icon={Wrench} tone="moss" />
        <StatCard label="Stored" value={`${totals.storedPct}%`} icon={PackageCheck} />
        <StatCard label="Billed" value={`${totals.billedPct}%`} icon={Receipt} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Pending Installation"
          value={formatQty(totals.pendingInstallationQty)}
          sub="Total qty across all items"
          icon={AlertTriangle}
          tone="rust"
        />
        <StatCard
          label="Pending Delivery"
          value={formatQty(totals.pendingDeliveryQty)}
          sub="Total qty across all items"
          icon={Clock}
          tone="rust"
        />
        <StatCard label="Today's Deliveries" value={String(deliveries)} sub="Delivery documents logged today" icon={CalendarClock} />
        <StatCard label="Today's Invoices" value={String(invoices)} sub="Invoice documents logged today" icon={FileText} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          label="Pending Invoice Quantity"
          value={formatQty(totals.pendingInvoiceQty)}
          sub="Delivered qty minus Invoiced qty"
          icon={ReceiptText}
          tone="rust"
        />
        <StatCard
          label="Pending Invoice Amount"
          value={formatCurrency(totals.pendingInvoiceAmount)}
          sub="Delivered amount minus Invoice amount"
          icon={ReceiptText}
          tone="rust"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <CategoryProgressChart rows={rows} />
        <StatusDonut rows={rows} />
      </div>
    </div>
  );
}
