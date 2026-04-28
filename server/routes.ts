import type { Express } from "express";
import type { Server } from "node:http";
import path from "node:path";
import fs from "node:fs";
import { storage } from "./storage";
import { catalogItemSchema, leadSchema, type CatalogItem } from "@shared/schema";

const dataPath = path.join(process.cwd(), "server", "catalog-data.json");

function loadCatalog(): CatalogItem[] {
  const raw = fs.readFileSync(dataPath, "utf8");
  const parsed = JSON.parse(raw);
  return catalogItemSchema.array().parse(parsed);
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.get("/api/catalog", (_req, res) => {
    const items = loadCatalog();
    res.json(items);
  });

  app.get("/api/stats", async (_req, res) => {
    const items = loadCatalog();
    const brands = new Set(items.map((item) => item.brand).filter(Boolean));
    const categories = new Set(items.map((item) => item.category).filter(Boolean));
    const leads = await storage.countLeads();
    res.json({
      items: items.length,
      brands: brands.size,
      categories: categories.size,
      leads,
      lastUpdated: new Date().toISOString(),
    });
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

  return httpServer;
}
