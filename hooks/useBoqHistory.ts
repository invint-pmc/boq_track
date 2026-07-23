"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export interface HistoryRow {
  id: string;
  entry_type: string;
  document_number: string;
  entry_date: string;
  vendor: string | null;
  remarks: string | null;
  quantity: number;
  invoice_amount: number | null;
}

export function useBoqHistory(boqItemId: string | null) {
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!boqItemId) {
      setHistory([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("entry_details")
        .select(
          "id, quantity, entry_header:entry_header_id ( entry_type, document_number, entry_date, vendor, remarks, invoice_amount )"
        )
        .eq("boq_item_id", boqItemId);

      if (err) throw err;

      const rows: HistoryRow[] = (data || []).map((d: any) => ({
        id: d.id,
        quantity: d.quantity,
        entry_type: d.entry_header?.entry_type,
        document_number: d.entry_header?.document_number,
        entry_date: d.entry_header?.entry_date,
        vendor: d.entry_header?.vendor,
        remarks: d.entry_header?.remarks,
        invoice_amount: d.entry_header?.invoice_amount ?? null,
      }));

      rows.sort((a, b) => (a.entry_date < b.entry_date ? 1 : -1));
      setHistory(rows);
    } catch (e: any) {
      setError(e?.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [boqItemId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, loading, error, refresh: fetchHistory };
}
