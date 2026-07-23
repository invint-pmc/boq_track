import { z } from "zod";

export const entryTypeSchema = z.enum(["Delivery", "Invoice", "Installation", "Stored"]);

export const entryRowSchema = z.object({
  boq_item_id: z.string().min(1, "Select a BOQ item"),
  boq_number: z.string(),
  description: z.string(),
  unit: z.string(),
  quantity: z.coerce.number().min(0, "Quantity cannot be negative"),
  // Present only when editing an existing document — id of the
  // entry_details row this form row maps to. Undefined means the row is
  // new and must be inserted rather than updated. Used only by the
  // entry-editing dialog; Universal Entry never sets this.
  entry_detail_id: z.string().optional(),
});

export const entryHeaderSchema = z
  .object({
    entry_type: entryTypeSchema,
    entry_date: z.string().min(1, "Date is required"),
    document_number: z.string().min(1, "Document number is required"),
    vendor: z.string().optional(),
    remarks: z.string().optional(),
    // Only meaningful for entry_type "Invoice" — see Invoice Improvements.
    invoice_amount: z.coerce.number().min(0, "Invoice amount cannot be negative").optional(),
    rows: z.array(entryRowSchema).min(1, "Add at least one row"),
  })
  .superRefine((val, ctx) => {
    if (val.entry_type === "Invoice" && (val.invoice_amount === undefined || Number.isNaN(val.invoice_amount))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["invoice_amount"],
        message: "Invoice amount is required for Invoice entries",
      });
    }
  });

export type EntryHeaderFormValues = z.infer<typeof entryHeaderSchema>;
export type EntryRowFormValues = z.infer<typeof entryRowSchema>;

export const boqItemFormSchema = z.object({
  boq_number: z.string().trim().min(1, "BOQ Number is required"),
  category_id: z.string().optional().nullable(),
  description: z.string().trim().min(1, "Description is required"),
  unit: z.string().trim().min(1, "Unit is required"),
  boq_qty: z.coerce.number().min(0, "Quantity cannot be negative"),
  rate: z.coerce.number().min(0, "Rate cannot be negative"),
});

export type BoqItemFormValues = z.infer<typeof boqItemFormSchema>;

export const boqImportRowSchema = z.object({
  "BOQ Number": z.union([z.string(), z.number()]),
  Category: z.string().optional().default(""),
  Description: z.string(),
  Unit: z.string().optional().default("Nos"),
  "BOQ Qty": z.union([z.string(), z.number()]),
  Rate: z.union([z.string(), z.number()]).optional().default(0),
  Amount: z.union([z.string(), z.number()]).optional().default(0),
});
