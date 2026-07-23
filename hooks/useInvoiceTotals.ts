"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

/**
 * Sum of entry_header.invoice_amount across all Invoice documents for a
 * project. Used only by the new "Pending Invoice Amount" dashboard KPI
 * (Feature 4) — does not affect any existing calculation.
 */
export function useInvoiceTotals(projectId: string | null) {
  const [totalInvoiceAmount, setTotalInvoiceAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchTotal = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from("entry_header").select("invoice_amount").eq("entry_type", "Invoice");
      if (projectId) query = query.eq("project_id", projectId);
      const { data, error } = await query;
      if (error) throw error;
      const sum = (data || []).reduce((acc, row: any) => acc + (Number(row.invoice_amount) || 0), 0);
      setTotalInvoiceAmount(sum);
    } catch {
      setTotalInvoiceAmount(0);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTotal();
  }, [fetchTotal]);

  return { totalInvoiceAmount, loading, refresh: fetchTotal };
}
