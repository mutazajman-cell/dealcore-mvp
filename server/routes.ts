import type { Express } from "express";
import type { Server } from "node:http";
import path from "node:path";
import fs from "node:fs";
import { storage } from "./storage";
import { catalogItemSchema, leadSchema, productInputSchema, supplierSchema, type CatalogItem } from "@shared/schema";

const dataPath = path.join(process.cwd(), "server", "catalog-data.json");

function loadCatalog(): CatalogItem[] {
  const raw = fs.readFileSync(dataPath, "utf8");
  const parsed = JSON.parse(raw);
  return catalogItemSchema.array().parse(parsed);
}

async function getCatalog(): Promise<CatalogItem[]> {
  const baseItems = loadCatalog();
  const manualItems = await storage.listProducts();
  const byId = new Map<string, CatalogItem>();
  for (const item of baseItems) byId.set(item.id, item);
  for (const item of manualItems) byId.set(item.id, item);
  return Array.from(byId.values());
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
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

  return httpServer;
}
