import { cn } from "@/lib/utils";
import type { BoqStatus } from "@/lib/calculations";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: LucideIcon;
  tone?: "default" | "rust" | "moss" | "blueprint";
}) {
  const toneClasses: Record<string, string> = {
    default: "text-ink",
    rust: "text-rust",
    moss: "text-moss",
    blueprint: "text-blueprint",
  };
  return (
    <div className="bg-surface border border-border rounded-md p-4 shadow-card flex flex-col gap-2 min-w-0">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink-soft uppercase tracking-wide">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-ink-faint" strokeWidth={2} />}
      </div>
      <div className={cn("font-display font-semibold text-2xl leading-none", toneClasses[tone])}>
        {value}
      </div>
      {sub && <div className="text-xs text-ink-faint">{sub}</div>}
    </div>
  );
}

const STATUS_STYLES: Record<BoqStatus, string> = {
  "Not Started": "bg-paper text-ink-soft border border-border",
  "Partially Delivered": "bg-rust-light text-rust border border-rust/30",
  Delivered: "bg-blueprint-light text-blueprint-dark border border-blueprint/20",
  "Partially Installed": "bg-rust-light text-rust border border-rust/30",
  Installed: "bg-moss-light text-moss border border-moss/30",
  Completed: "bg-moss-light text-moss border border-moss/30",
};

export function StatusPill({ status }: { status: BoqStatus }) {
  return (
    <span className={cn("inline-block px-2 py-0.5 rounded text-[11px] font-medium", STATUS_STYLES[status])}>
      {status}
    </span>
  );
}

export function TagChip({ children }: { children: React.ReactNode }) {
  return <span className="tag-chip">{children}</span>;
}

export function Button({
  children,
  variant = "primary",
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  const variants: Record<string, string> = {
    primary: "bg-blueprint text-white hover:bg-blueprint-dark",
    secondary: "bg-surface border border-border text-ink hover:bg-paper",
    ghost: "text-ink-soft hover:bg-paper",
    danger: "bg-danger text-white hover:opacity-90",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 text-ink-soft">
      <div className="font-display font-medium text-ink mb-1">{title}</div>
      <div className="text-sm max-w-sm">{description}</div>
    </div>
  );
}
