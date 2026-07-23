import * as XLSX from "xlsx";
import type { BoqItemProgress } from "@/lib/types";
import { deriveStatus } from "@/lib/calculations";

export interface ParsedBoqRow {
  boqNumber: string;
  category: string;
  description: string;
  unit: string;
  boqQty: number;
  rate: number;
  amount: number;
}

/** Parses an uploaded BOQ Excel file (first sheet) into normalized rows. */
export async function parseBoqExcelFile(file: File): Promise<ParsedBoqRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const raw = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });

  return raw
    .filter((row) => String(row["BOQ Number"] ?? "").trim() !== "")
    .map((row) => {
      const boqQty = Number(row["BOQ Qty"] ?? 0) || 0;
      const rate = Number(row["Rate"] ?? 0) || 0;
      const amountRaw = row["Amount"];
      const amount = amountRaw !== undefined && amountRaw !== "" ? Number(amountRaw) || 0 : boqQty * rate;

      return {
        boqNumber: String(row["BOQ Number"]).trim(),
        category: String(row["Category"] ?? "").trim(),
        description: String(row["Description"] ?? "").trim(),
        unit: String(row["Unit"] ?? "Nos").trim() || "Nos",
        boqQty,
        rate,
        amount,
      };
    });
}

/** Exports the BOQ register (with computed progress) to an .xlsx file download. */
export function exportBoqRegisterToExcel(rows: BoqItemProgress[], filename = "BOQ_Register.xlsx") {
  const data = rows.map((r) => ({
    "BOQ Number": r.boq_number,
    Category: r.category_name || "Uncategorized",
    Description: r.description,
    Unit: r.unit,
    "BOQ Qty": r.boq_qty,
    Delivered: r.delivered_qty,
    Installed: r.installed_qty,
    Stored: r.stored_qty,
    Billed: r.billed_qty,
    "Pending Installation": Math.max(r.pending_installation_qty, 0),
    "Pending Delivery": Math.max(r.pending_delivery_qty, 0),
    Rate: r.rate,
    Amount: r.amount,
    Status: deriveStatus(r),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "BOQ Register");
  XLSX.writeFile(workbook, filename);
}

/** Downloads a template Excel file matching the required import columns. */
export function downloadBoqImportTemplate(filename = "BOQ_Import_Template.xlsx") {
  const data = [
    {
      "BOQ Number": "EX-001",
      Category: "Exhaust",
      Description: "Example: 6 inch GI exhaust duct",
      Unit: "Mtr",
      "BOQ Qty": 100,
      Rate: 450,
      Amount: 45000,
    },
  ];
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "BOQ Import");
  XLSX.writeFile(workbook, filename);
}
