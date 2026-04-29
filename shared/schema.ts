import { z } from "zod";

export const catalogItemSchema = z.object({
  id: z.string(),
  category: z.string(),
  subcategory: z.string().optional().default(""),
  brand: z.string(),
  model: z.string(),
  title: z.string(),
  description: z.string(),
  cpu: z.string().optional().default(""),
  ramGb: z.union([z.string(), z.number()]).optional().default(""),
  ssdGb: z.union([z.string(), z.number()]).optional().default(""),
  condition: z.string().optional().default(""),
  quantity: z.union([z.string(), z.number()]).optional().default(""),
  priceAed: z.union([z.string(), z.number()]).optional().default(""),
  priceRub: z.union([z.string(), z.number()]).optional().default(""),
  priceStatus: z.string().optional().default("By request"),
  availability: z.string().optional().default("Check availability"),
  seller: z.string().optional().default(""),
  whatsapp: z.string().optional().default(""),
  location: z.string().optional().default("UAE"),
  leadAction: z.string().optional().default("Request price"),
  photoUrl: z.string().optional().default(""),
});

export const productInputSchema = catalogItemSchema
  .omit({ id: true })
  .extend({
    id: z.string().optional(),
    title: z.string().optional().default(""),
    description: z.string().optional().default(""),
  });

export const leadSchema = z.object({
  productId: z.string().optional().default(""),
  productTitle: z.string().optional().default(""),
  requestType: z.enum(["buyer_request", "inspection_request", "supplier_onboarding", "general"]).default("buyer_request"),
  name: z.string().min(2, "Name is required"),
  contact: z.string().min(5, "Contact is required"),
  company: z.string().optional().default(""),
  message: z.string().min(5, "Message is required"),
});

export const supplierSchema = z.object({
  name: z.string().min(2, "Name is required"),
  contact: z.string().min(5, "Contact is required"),
  company: z.string().optional().default(""),
  location: z.string().optional().default("UAE"),
  whatsapp: z.string().optional().default(""),
  categories: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

export type CatalogItem = z.infer<typeof catalogItemSchema>;
export type ProductInput = z.infer<typeof productInputSchema>;
export type LeadInput = z.infer<typeof leadSchema>;
export type SupplierInput = z.infer<typeof supplierSchema>;

export type Lead = LeadInput & {
  id: number;
  createdAt: string;
  status: "new" | "contacted" | "closed";
};

export type Supplier = SupplierInput & {
  id: number;
  createdAt: string;
  status: "new" | "active" | "paused";
};
