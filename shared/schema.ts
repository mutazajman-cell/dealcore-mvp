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

export const inspectorSchema = z.object({
  name: z.string().min(2, "Name is required"),
  contact: z.string().min(5, "Contact is required"),
  location: z.string().optional().default("UAE"),
  languages: z.string().optional().default("RU / EN"),
  priceAed: z.union([z.string(), z.number()]).optional().default(""),
  rating: z.union([z.string(), z.number()]).optional().default("5.0"),
  completedChecks: z.union([z.string(), z.number()]).optional().default("0"),
  availability: z.string().optional().default("Today / tomorrow"),
  notes: z.string().optional().default(""),
});

export const inspectionReportSchema = z.object({
  leadId: z.union([z.string(), z.number()]).optional().default(""),
  productTitle: z.string().min(2, "Product is required"),
  inspectorName: z.string().min(2, "Inspector is required"),
  supplierName: z.string().optional().default(""),
  serialNumber: z.string().optional().default(""),
  displayTest: z.string().optional().default("Not checked"),
  temperatureTest: z.string().optional().default("Not checked"),
  portsTest: z.string().optional().default("Not checked"),
  keyboardTest: z.string().optional().default("Not checked"),
  batteryTest: z.string().optional().default("Not checked"),
  photosLink: z.string().optional().default(""),
  verdict: z.enum(["pass", "conditional", "fail"]).default("conditional"),
  comments: z.string().optional().default(""),
});

export const cargoRequestSchema = z.object({
  productId: z.string().optional().default(""),
  productTitle: z.string().optional().default(""),
  buyerName: z.string().min(2, "Name is required"),
  buyerContact: z.string().min(5, "Contact is required"),
  cityRf: z.string().optional().default(""),
  deliveryAddressRf: z.string().optional().default(""),
  itemPriceAed: z.union([z.string(), z.number()]).optional().default(""),
  quantity: z.union([z.string(), z.number()]).optional().default(""),
  supplierContact: z.string().optional().default(""),
  supplierAddressUae: z.string().optional().default(""),
  paymentMethod: z.string().optional().default(""),
  comments: z.string().optional().default(""),
});

export type CatalogItem = z.infer<typeof catalogItemSchema>;
export type ProductInput = z.infer<typeof productInputSchema>;
export type LeadInput = z.infer<typeof leadSchema>;
export type SupplierInput = z.infer<typeof supplierSchema>;
export type InspectorInput = z.infer<typeof inspectorSchema>;
export type InspectionReportInput = z.infer<typeof inspectionReportSchema>;
export type CargoRequestInput = z.infer<typeof cargoRequestSchema>;

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

export type Inspector = InspectorInput & {
  id: number;
  createdAt: string;
  status: "new" | "active" | "paused" | "blocked";
};

export type InspectionReport = InspectionReportInput & {
  id: number;
  createdAt: string;
  status: "draft" | "sent" | "accepted" | "disputed";
};

export type CargoRequest = CargoRequestInput & {
  id: number;
  createdAt: string;
  status: "new" | "sent_to_partner" | "in_progress" | "closed";
};
