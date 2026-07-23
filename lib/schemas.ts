import { z } from "zod";

export const entryTypeSchema = z.enum(["Delivery", "Invoice", "Installation", "Stored"]);

export const entryRowSchema = z.object({
  boq_item_id: z.string().min(1, "Select a BOQ item"),
  boq_number: z.string(),
  description: z.string(),
  unit: z.string(),
  quantity: z.coerce.number().min(0, "Quantity cannot be negative"),
});

export const entryHeaderSchema = z.object({
  entry_type: entryTypeSchema,
  entry_date: z.string().min(1, "Date is required"),
  document_number: z.string().min(1, "Document number is required"),
  vendor: z.string().optional(),
  remarks: z.string().optional(),
  rows: z.array(entryRowSchema).min(1, "Add at least one row"),
});

export type EntryHeaderFormValues = z.infer<typeof entryHeaderSchema>;
export type EntryRowFormValues = z.infer<typeof entryRowSchema>;

export const boqImportRowSchema = z.object({
  "BOQ Number": z.union([z.string(), z.number()]),
  Category: z.string().optional().default(""),
  Description: z.string(),
  Unit: z.string().optional().default("Nos"),
  "BOQ Qty": z.union([z.string(), z.number()]),
  Rate: z.union([z.string(), z.number()]).optional().default(0),
  Amount: z.union([z.string(), z.number()]).optional().default(0),
});
