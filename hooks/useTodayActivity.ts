"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { todayISO } from "@/lib/utils";

export function useTodayActivity() {
  const [deliveries, setDeliveries] = useState(0);
  const [invoices, setInvoices] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const today = todayISO();

    Promise.all([
      supabase
        .from("entry_header")
        .select("id", { count: "exact", head: true })
        .eq("entry_type", "Delivery")
        .eq("entry_date", today),
      supabase
        .from("entry_header")
        .select("id", { count: "exact", head: true })
        .eq("entry_type", "Invoice")
        .eq("entry_date", today),
    ]).then(([d, i]) => {
      if (!active) return;
      setDeliveries(d.count || 0);
      setInvoices(i.count || 0);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  return { deliveries, invoices, loading };
}
