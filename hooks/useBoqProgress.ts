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

export function useBoqProgress(): UseBoqProgressResult {
  const [rows, setRows] = useState<BoqItemProgress[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [progressRes, categoriesRes] = await Promise.all([
        supabase.from("boq_item_progress").select("*").order("boq_number", { ascending: true }),
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
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { rows, categories, loading, error, refresh: fetchData };
}
