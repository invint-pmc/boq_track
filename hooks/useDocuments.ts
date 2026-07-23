"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { EntryHeader, EntryType } from "@/lib/types";

export interface DocumentLine {
  id: string;
  boq_number: string;
  description: string;
  unit: string;
  quantity: number;
}

export interface DocumentWithLines extends EntryHeader {
  lines: DocumentLine[];
}

export interface DocumentFilters {
  documentNumber: string;
  vendor: string;
  dateFrom: string;
  dateTo: string;
  entryType: EntryType | "All";
}

export const EMPTY_DOCUMENT_FILTERS: DocumentFilters = {
  documentNumber: "",
  vendor: "",
  dateFrom: "",
  dateTo: "",
  entryType: "All",
};

export function useDocuments(filters: DocumentFilters) {
  const [documents, setDocuments] = useState<EntryHeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from("entry_header").select("*").order("entry_date", { ascending: false });

      if (filters.documentNumber.trim()) {
        query = query.ilike("document_number", `%${filters.documentNumber.trim()}%`);
      }
      if (filters.vendor.trim()) {
        query = query.ilike("vendor", `%${filters.vendor.trim()}%`);
      }
      if (filters.entryType !== "All") {
        query = query.eq("entry_type", filters.entryType);
      }
      if (filters.dateFrom) {
        query = query.gte("entry_date", filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte("entry_date", filters.dateTo);
      }

      const { data, error: err } = await query;
      if (err) throw err;
      setDocuments(data || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return { documents, loading, error, refresh: fetchDocuments };
}

export async function fetchDocumentDetail(headerId: string): Promise<DocumentWithLines | null> {
  const { data: header, error: headerErr } = await supabase
    .from("entry_header")
    .select("*")
    .eq("id", headerId)
    .single();

  if (headerErr || !header) return null;

  const { data: details, error: detailsErr } = await supabase
    .from("entry_details")
    .select("id, quantity, boq_item:boq_item_id ( boq_number, description, unit )")
    .eq("entry_header_id", headerId);

  if (detailsErr) return { ...(header as EntryHeader), lines: [] };

  const lines: DocumentLine[] = (details || []).map((d: any) => ({
    id: d.id,
    quantity: d.quantity,
    boq_number: d.boq_item?.boq_number || "—",
    description: d.boq_item?.description || "—",
    unit: d.boq_item?.unit || "",
  }));

  return { ...(header as EntryHeader), lines };
}
