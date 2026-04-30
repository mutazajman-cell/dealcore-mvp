import type { Express } from "express";
import type { Server } from "node:http";
import path from "node:path";
import fs from "node:fs";
import { storage } from "./storage";
import {
  cargoRequestSchema,
  catalogItemSchema,
  inspectionReportSchema,
  inspectorSchema,
  leadSchema,
  modelLibraryEntrySchema,
  productInputSchema,
  supplierSchema,
  type CatalogItem,
  type ModelLibraryEntry,
} from "@shared/schema";

const dataPath = path.join(process.cwd(), "server", "catalog-data.json");
const modelLibraryPath = path.join(process.cwd(), "server", "model-library.json");

function loadCatalog(): CatalogItem[] {
  const raw = fs.readFileSync(dataPath, "utf8");
  const parsed = JSON.parse(raw);
  return catalogItemSchema.array().parse(parsed);
}

let modelLibraryCache: ModelLibraryEntry[] | null = null;

function loadModelLibrary(): ModelLibraryEntry[] {
  if (modelLibraryCache) return modelLibraryCache;
  try {
    const raw = fs.readFileSync(modelLibraryPath, "utf8");
    const parsed = JSON.parse(raw);
    modelLibraryCache = modelLibraryEntrySchema.array().parse(parsed);
  } catch {
    modelLibraryCache = [];
  }
  return modelLibraryCache;
}

function modelKey(item: Pick<CatalogItem, "brand" | "model">): string {
  return `${item.brand} ${item.model}`.trim().toLowerCase();
}

async function getCatalog(): Promise<CatalogItem[]> {
  const baseItems = loadCatalog();
  const manualItems = await storage.listProducts();
  const library = loadModelLibrary();
  const photoByModel = new Map<string, string>();
  for (const item of baseItems) {
    if (item.photoUrl) photoByModel.set(modelKey(item), item.photoUrl);
  }
  for (const entry of library) {
    if (entry.photoUrl) {
      const k = modelKey(entry);
      if (!photoByModel.has(k)) photoByModel.set(k, entry.photoUrl);
    }
  }
  const byId = new Map<string, CatalogItem>();
  for (const item of baseItems) {
    byId.set(item.id, {
      ...item,
      photoUrl: item.photoUrl || photoByModel.get(modelKey(item)) || "",
    });
  }
  for (const item of manualItems) {
    byId.set(item.id, {
      ...item,
      photoUrl: item.photoUrl || photoByModel.get(modelKey(item)) || "",
    });
  }
  return Array.from(byId.values());
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.get("/api/model-library", (_req, res) => {
    try {
      const items = loadModelLibrary().filter((entry) => entry.publish !== false);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Model library error" });
    }
  });

  app.get("/api/catalog", (_req, res) => {
    getCatalog()
      .then((items) => res.json(items))
      .catch((error) => res.status(500).json({ message: error instanceof Error ? error.message : "Catalog error" }));
  });

  app.get("/api/stats", async (_req, res) => {
    const items = await getCatalog();
    const brands = new Set(items.map((item) => item.brand).filter(Boolean));
    const categories = new Set(items.map((item) => item.category).filter(Boolean));
    const leads = await storage.countLeads();
    const suppliers = await storage.countSuppliers();
    res.json({
      items: items.length,
      brands: brands.size,
      categories: categories.size,
      leads,
      suppliers,
      lastUpdated: new Date().toISOString(),
    });
  });

  app.post("/api/products", async (req, res) => {
    const input = productInputSchema.parse(req.body);
    const product = await storage.createProduct(input);
    res.status(201).json(product);
  });

  app.post("/api/leads", async (req, res) => {
    const input = leadSchema.parse(req.body);
    const lead = await storage.createLead(input);
    res.status(201).json(lead);
  });

  app.get("/api/leads", async (_req, res) => {
    const leads = await storage.listLeads();
    res.json(leads);
  });

  app.get("/api/suppliers", async (_req, res) => {
    const suppliers = await storage.listSuppliers();
    res.json(suppliers);
  });

  app.post("/api/suppliers", async (req, res) => {
    const input = supplierSchema.parse(req.body);
    const supplier = await storage.createSupplier(input);
    res.status(201).json(supplier);
  });

  app.get("/api/inspectors", async (_req, res) => {
    const inspectors = await storage.listInspectors();
    res.json(inspectors);
  });

  app.post("/api/inspectors", async (req, res) => {
    const input = inspectorSchema.parse(req.body);
    const inspector = await storage.createInspector(input);
    res.status(201).json(inspector);
  });

  app.get("/api/inspection-reports", async (_req, res) => {
    const reports = await storage.listInspectionReports();
    res.json(reports);
  });

  app.post("/api/inspection-reports", async (req, res) => {
    const input = inspectionReportSchema.parse(req.body);
    const report = await storage.createInspectionReport(input);
    res.status(201).json(report);
  });

  app.get("/api/cargo-requests", async (_req, res) => {
    const requests = await storage.listCargoRequests();
    res.json(requests);
  });

  app.post("/api/cargo-requests", async (req, res) => {
    const input = cargoRequestSchema.parse(req.body);
    const request = await storage.createCargoRequest(input);
    res.status(201).json(request);
  });

  return httpServer;
}
