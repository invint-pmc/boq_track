"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, ListChecks, PenSquare, FolderSearch, Ruler } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/hooks/useAuth";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutGrid, adminOnly: false },
  { href: "/boq-register", label: "BOQ Register", icon: ListChecks, adminOnly: false },
  { href: "/universal-entry", label: "Universal Entry", icon: PenSquare, adminOnly: true },
  { href: "/document-explorer", label: "Document Explorer", icon: FolderSearch, adminOnly: false },
];

export default function Sidebar({ role }: { role: AppRole }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || role === "Admin");

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-surface hidden md:flex md:flex-col">
      <div className="h-16 flex items-center gap-2 px-5 border-b border-border">
        <div className="w-8 h-8 rounded bg-blueprint flex items-center justify-center">
          <Ruler className="w-4 h-4 text-white" strokeWidth={2.25} />
        </div>
        <div className="font-display font-semibold text-[15px] leading-tight text-ink">
          BOQ Tracker
        </div>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors",
                active
                  ? "bg-blueprint-light text-blueprint-dark"
                  : "text-ink-soft hover:bg-paper hover:text-ink"
              )}
            >
              <Icon className="w-4 h-4" strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t border-border text-[11px] text-ink-faint leading-relaxed">
        BOQ execution tracker.
        <br />
        Not an ERP or accounting system.
      </div>
    </aside>
  );
}
