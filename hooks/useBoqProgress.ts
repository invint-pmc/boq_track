"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { BoqItemProgress, Category } from "@/lib/types";

interface UseBoqProgressResult {
  rows: BoqItemProgress[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * @param filter "active" (default) returns only non-archived BOQ items —
 * this is what Dashboard, Universal Entry, and the default BOQ Register
 * view use. "archived" returns only archived items (for the Archived
 * view / Restore action). "all" returns everything, archived or not.
 */
export function useBoqProgress(filter: "active" | "archived" | "all" = "active"): UseBoqProgressResult {
  const [rows, setRows] = useState<BoqItemProgress[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let progressQuery = supabase.from("boq_item_progress").select("*").order("boq_number", { ascending: true });
      if (filter === "active") progressQuery = progressQuery.eq("archived", false);
      if (filter === "archived") progressQuery = progressQuery.eq("archived", true);

      const [progressRes, categoriesRes] = await Promise.all([
        progressQuery,
        supabase.from("categories").select("*").order("sort_order", { ascending: true }),
      ]);

      if (progressRes.error) throw progressRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      const catMap = new Map((categoriesRes.data || []).map((c) => [c.id, c.name]));
      const enriched = (progressRes.data || []).map((r: BoqItemProgress) => ({
        ...r,
        category_name: r.category_id ? catMap.get(r.category_id) || "Uncategorized" : "Uncategorized",
      }));

      setRows(enriched);
      setCategories(categoriesRes.data || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load BOQ data");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { rows, categories, loading, error, refresh: fetchData };
}
