"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { BoqItemProgress } from "@/lib/types";
import { deriveStatus } from "@/lib/calculations";

const STATUS_COLORS: Record<string, string> = {
  "Not Started": "#C3C9CD",
  "Partially Delivered": "#C7752E",
  Delivered: "#1F5FA8",
  "Partially Installed": "#C7752E",
  Installed: "#2F8F5B",
  Completed: "#2F8F5B",
};

export function CategoryProgressChart({ rows }: { rows: BoqItemProgress[] }) {
  const byCategory = new Map<string, { category: string; delivered: number; installed: number; total: number }>();

  rows.forEach((r) => {
    const key = r.category_name || "Uncategorized";
    const existing = byCategory.get(key) || { category: key, delivered: 0, installed: 0, total: 0 };
    existing.delivered += r.delivered_qty || 0;
    existing.installed += r.installed_qty || 0;
    existing.total += r.boq_qty || 0;
    byCategory.set(key, existing);
  });

  const data = Array.from(byCategory.values()).map((c) => ({
    category: c.category,
    "Delivered %": c.total ? Math.round((c.delivered / c.total) * 1000) / 10 : 0,
    "Installed %": c.total ? Math.round((c.installed / c.total) * 1000) / 10 : 0,
  }));

  return (
    <div className="bg-surface border border-border rounded-md p-4 shadow-card">
      <div className="text-sm font-medium text-ink mb-3">Progress by Category</div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#DDE1E3" vertical={false} />
          <XAxis dataKey="category" tick={{ fontSize: 11, fill: "#5B6572" }} interval={0} angle={-20} textAnchor="end" height={60} />
          <YAxis tick={{ fontSize: 11, fill: "#5B6572" }} unit="%" />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, borderColor: "#DDE1E3" }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Delivered %" fill="#1F5FA8" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Installed %" fill="#2F8F5B" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusDonut({ rows }: { rows: BoqItemProgress[] }) {
  const counts = new Map<string, number>();
  rows.forEach((r) => {
    const status = deriveStatus(r);
    counts.set(status, (counts.get(status) || 0) + 1);
  });

  const data = Array.from(counts.entries()).map(([name, value]) => ({ name, value }));

  return (
    <div className="bg-surface border border-border rounded-md p-4 shadow-card">
      <div className="text-sm font-medium text-ink mb-3">BOQ Items by Status</div>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || "#C3C9CD"} />
            ))}
          </Pie>
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, borderColor: "#DDE1E3" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
