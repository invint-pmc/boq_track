export type EntryType = "Delivery" | "Invoice" | "Installation" | "Stored";

export type ProjectStatus = "Planning" | "Active" | "On Hold" | "Completed";

export interface Project {
  id: string;
  name: string;
  client_name: string | null;
  location: string | null;
  start_date: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface BoqItem {
  id: string;
  project_id: string;
  category_id: string | null;
  boq_number: string;
  description: string;
  unit: string;
  boq_qty: number;
  rate: number;
  amount: number;
  archived: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BoqItemProgress {
  boq_item_id: string;
  project_id: string;
  category_id: string | null;
  boq_number: string;
  description: string;
  unit: string;
  boq_qty: number;
  rate: number;
  amount: number;
  archived: boolean;
  archived_at: string | null;
  delivered_qty: number;
  installed_qty: number;
  stored_qty: number;
  billed_qty: number;
  pending_delivery_qty: number;
  pending_installation_qty: number;
  category_name?: string;
}

export interface EntryHeader {
  id: string;
  project_id: string;
  entry_type: EntryType;
  document_number: string;
  entry_date: string;
  vendor: string | null;
  remarks: string | null;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface EntryDetail {
  id: string;
  entry_header_id: string;
  boq_item_id: string;
  quantity: number;
}

export interface EntryDetailWithBoq extends EntryDetail {
  boq_number: string;
  description: string;
  unit: string;
}
