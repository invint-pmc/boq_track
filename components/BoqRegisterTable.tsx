"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, Pencil, Archive, ArchiveRestore } from "lucide-react";
import type { BoqItemProgress } from "@/lib/types";
import { deriveStatus, formatQty } from "@/lib/calculations";
import { StatusPill, TagChip } from "@/components/ui";
import { cn } from "@/lib/utils";

const columnHelper = createColumnHelper<BoqItemProgress>();

export default function BoqRegisterTable({
  rows,
  onRowClick,
  showActions = false,
  showArchived = false,
  onEdit,
  onArchive,
  onRestore,
}: {
  rows: BoqItemProgress[];
  onRowClick: (row: BoqItemProgress) => void;
  /** Whether to render the Edit/Archive/Restore actions column at all (Admin-only). */
  showActions?: boolean;
  /** Whether this table is showing archived items (renders Restore instead of Edit/Archive). */
  showArchived?: boolean;
  onEdit?: (row: BoqItemProgress) => void;
  onArchive?: (row: BoqItemProgress) => void;
  onRestore?: (row: BoqItemProgress) => void;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);

  // --- Feature 5: frozen header + a second, synced horizontal scrollbar at
  // the top. Purely presentational — no change to columns, sorting, data,
  // or actions above/below this point.
  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const [tableWidth, setTableWidth] = useState(0);
  const syncingRef = useRef<"top" | "bottom" | null>(null);

  useEffect(() => {
    const tableEl = tableRef.current;
    if (!tableEl) return;
    const measure = () => setTableWidth(tableEl.scrollWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(tableEl);
    return () => observer.disconnect();
  }, [rows, showActions, showArchived]);

  function handleTopScroll() {
    if (syncingRef.current === "bottom") {
      syncingRef.current = null;
      return;
    }
    if (!topScrollRef.current || !bottomScrollRef.current) return;
    syncingRef.current = "top";
    bottomScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
  }

  function handleBottomScroll() {
    if (syncingRef.current === "top") {
      syncingRef.current = null;
      return;
    }
    if (!topScrollRef.current || !bottomScrollRef.current) return;
    syncingRef.current = "bottom";
    topScrollRef.current.scrollLeft = bottomScrollRef.current.scrollLeft;
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor("boq_number", {
        header: "BOQ Number",
        cell: (info) => <TagChip>{info.getValue()}</TagChip>,
      }),
      columnHelper.accessor("category_name", {
        header: "Category",
        cell: (info) => <span className="text-ink-soft">{info.getValue()}</span>,
      }),
      columnHelper.accessor("description", {
        header: "Description",
        cell: (info) => <span className="max-w-[280px] truncate block">{info.getValue()}</span>,
      }),
      columnHelper.accessor("unit", { header: "Unit" }),
      columnHelper.accessor("boq_qty", {
        header: "BOQ Qty",
        cell: (info) => <span className="font-mono">{formatQty(info.getValue())}</span>,
      }),
      columnHelper.accessor("delivered_qty", {
        header: "Delivered",
        cell: (info) => <span className="font-mono text-blueprint">{formatQty(info.getValue())}</span>,
      }),
      columnHelper.accessor("installed_qty", {
        header: "Installed",
        cell: (info) => <span className="font-mono text-moss">{formatQty(info.getValue())}</span>,
      }),
      columnHelper.accessor("stored_qty", {
        header: "Stored",
        cell: (info) => <span className="font-mono">{formatQty(info.getValue())}</span>,
      }),
      columnHelper.accessor("billed_qty", {
        header: "Billed",
        cell: (info) => <span className="font-mono text-rust">{formatQty(info.getValue())}</span>,
      }),
      columnHelper.accessor("pending_installation_qty", {
        header: "Pending Installation",
        cell: (info) => {
          const v = Math.max(info.getValue(), 0);
          return <span className={cn("font-mono", v > 0 && "text-rust font-medium")}>{formatQty(v)}</span>;
        },
      }),
      columnHelper.accessor("pending_delivery_qty", {
        header: "Pending Delivery",
        cell: (info) => {
          const v = Math.max(info.getValue(), 0);
          return <span className={cn("font-mono", v > 0 && "text-rust font-medium")}>{formatQty(v)}</span>;
        },
      }),
      columnHelper.display({
        id: "status",
        header: "Status",
        cell: (info) => <StatusPill status={deriveStatus(info.row.original)} />,
      }),
      ...(showActions
        ? [
            columnHelper.display({
              id: "actions",
              header: "Actions",
              cell: (info) => {
                const row = info.row.original;
                return (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {showArchived ? (
                      <button
                        type="button"
                        onClick={() => onRestore?.(row)}
                        className="p-1.5 rounded hover:bg-paper text-ink-soft hover:text-moss"
                        aria-label={`Restore ${row.boq_number}`}
                        title="Restore"
                      >
                        <ArchiveRestore className="w-4 h-4" />
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onEdit?.(row)}
                          className="p-1.5 rounded hover:bg-paper text-ink-soft hover:text-blueprint"
                          aria-label={`Edit ${row.boq_number}`}
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onArchive?.(row)}
                          className="p-1.5 rounded hover:bg-paper text-ink-soft hover:text-rust"
                          aria-label={`Archive ${row.boq_number}`}
                          title="Archive"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                );
              },
            }),
          ]
        : []),
    ],
    [showActions, showArchived, onEdit, onArchive, onRestore]
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="border border-border rounded-md bg-surface shadow-card">
      {/* Second horizontal scrollbar, pinned to the top, synced with the table's own bottom scrollbar. */}
      <div
        ref={topScrollRef}
        onScroll={handleTopScroll}
        className="overflow-x-auto overflow-y-hidden border-b border-border"
        style={{ scrollbarGutter: "stable" }}
      >
        <div style={{ width: tableWidth || "100%", height: 1 }} />
      </div>

      <div
        ref={bottomScrollRef}
        onScroll={handleBottomScroll}
        className="overflow-auto max-h-[65vh]"
      >
        <table ref={tableRef} className="w-full text-sm whitespace-nowrap">
          <thead className="bg-paper sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 py-2.5 text-left text-xs font-medium text-ink-soft border-b border-border cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <span className="inline-flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <ArrowUpDown className="w-3 h-3 text-ink-faint" />
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border last:border-0 hover:bg-blueprint-light/40 cursor-pointer"
                onClick={() => onRowClick(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2.5 text-ink">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-10 text-center text-ink-faint">
                  No BOQ items match your search or filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
