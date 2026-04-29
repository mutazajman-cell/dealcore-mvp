import Database from "better-sqlite3";
import type { CatalogItem, Lead, LeadInput, ProductInput, Supplier, SupplierInput } from "@shared/schema";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

function normalizeWhatsApp(input?: string): string {
  const raw = (input || "").trim();
  if (!raw) return "";

  const withoutProtocol = raw
    .replace(/^https?:\/?\/?/i, "")
    .replace(/^www\./i, "")
    .replace(/^web\.whatsapp\.com\/send\?phone=/i, "")
    .replace(/^api\.whatsapp\.com\/send\?phone=/i, "")
    .replace(/^(wa|we)\.me\/?/i, "");

  let digits = withoutProtocol.replace(/\D/g, "");
  if (!digits) return raw;
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `971${digits.slice(1)}`;

  return `https://wa.me/${digits}`;
}

sqlite
  .prepare(
    `CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      request_type TEXT NOT NULL,
      product_id TEXT,
      product_title TEXT,
      name TEXT NOT NULL,
      contact TEXT NOT NULL,
      company TEXT,
      message TEXT NOT NULL
    )`,
  )
  .run();

sqlite
  .prepare(
    `CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      publish TEXT NOT NULL DEFAULT 'yes',
      category TEXT NOT NULL,
      subcategory TEXT,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      cpu TEXT,
      ram_gb TEXT,
      ssd_gb TEXT,
      condition TEXT,
      quantity TEXT,
      price_aed TEXT,
      price_rub TEXT,
      price_status TEXT,
      availability TEXT,
      seller TEXT,
      whatsapp TEXT,
      location TEXT,
      lead_action TEXT,
      photo_url TEXT
    )`,
  )
  .run();

function ensureColumn(table: string, column: string, definition: string) {
  const columns = sqlite.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!columns.some((item) => item.name === column)) {
    sqlite.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
  }
}

ensureColumn("products", "quantity", "TEXT");

sqlite
  .prepare(
    `CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      name TEXT NOT NULL,
      contact TEXT NOT NULL,
      company TEXT,
      location TEXT,
      whatsapp TEXT,
      categories TEXT,
      notes TEXT
    )`,
  )
  .run();

export interface IStorage {
  createLead(input: LeadInput): Promise<Lead>;
  listLeads(): Promise<Lead[]>;
  countLeads(): Promise<number>;
  listProducts(): Promise<CatalogItem[]>;
  createProduct(input: ProductInput): Promise<CatalogItem>;
  listSuppliers(): Promise<Supplier[]>;
  createSupplier(input: SupplierInput): Promise<Supplier>;
  countSuppliers(): Promise<number>;
}

function mapLead(row: Record<string, unknown>): Lead {
  return {
    id: Number(row.id),
    createdAt: String(row.created_at),
    status: String(row.status) as Lead["status"],
    requestType: String(row.request_type) as Lead["requestType"],
    productId: String(row.product_id || ""),
    productTitle: String(row.product_title || ""),
    name: String(row.name),
    contact: String(row.contact),
    company: String(row.company || ""),
    message: String(row.message),
  };
}

function mapProduct(row: Record<string, unknown>): CatalogItem {
  return {
    id: String(row.id),
    category: String(row.category || ""),
    subcategory: String(row.subcategory || ""),
    brand: String(row.brand || ""),
    model: String(row.model || ""),
    title: String(row.title || ""),
    description: String(row.description || ""),
    cpu: String(row.cpu || ""),
    ramGb: String(row.ram_gb || ""),
    ssdGb: String(row.ssd_gb || ""),
    condition: String(row.condition || ""),
    quantity: String(row.quantity || ""),
    priceAed: String(row.price_aed || ""),
    priceRub: String(row.price_rub || ""),
    priceStatus: String(row.price_status || "By request"),
    availability: String(row.availability || "Check availability"),
    seller: String(row.seller || ""),
    whatsapp: String(row.whatsapp || ""),
    location: String(row.location || "UAE"),
    leadAction: String(row.lead_action || "Request price"),
    photoUrl: String(row.photo_url || ""),
  };
}

function mapSupplier(row: Record<string, unknown>): Supplier {
  return {
    id: Number(row.id),
    createdAt: String(row.created_at),
    status: String(row.status) as Supplier["status"],
    name: String(row.name),
    contact: String(row.contact),
    company: String(row.company || ""),
    location: String(row.location || "UAE"),
    whatsapp: String(row.whatsapp || ""),
    categories: String(row.categories || ""),
    notes: String(row.notes || ""),
  };
}

export class DatabaseStorage implements IStorage {
  async createLead(input: LeadInput): Promise<Lead> {
    const createdAt = new Date().toISOString();
    const result = sqlite
      .prepare(
        `INSERT INTO leads (
          created_at, status, request_type, product_id, product_title, name, contact, company, message
        ) VALUES (
          @createdAt, 'new', @requestType, @productId, @productTitle, @name, @contact, @company, @message
        )`,
      )
      .run({
        createdAt,
        requestType: input.requestType,
        productId: input.productId || "",
        productTitle: input.productTitle || "",
        name: input.name,
        contact: input.contact,
        company: input.company || "",
        message: input.message,
      });

    const row = sqlite.prepare("SELECT * FROM leads WHERE id = ?").get(result.lastInsertRowid) as Record<
      string,
      unknown
    >;
    return mapLead(row);
  }

  async listLeads(): Promise<Lead[]> {
    const rows = sqlite
      .prepare("SELECT * FROM leads ORDER BY id DESC LIMIT 200")
      .all() as Record<string, unknown>[];
    return rows.map(mapLead);
  }

  async countLeads(): Promise<number> {
    const row = sqlite.prepare("SELECT COUNT(*) as count FROM leads").get() as { count: number };
    return row.count;
  }

  async listProducts(): Promise<CatalogItem[]> {
    const rows = sqlite
      .prepare("SELECT * FROM products WHERE publish = 'yes' ORDER BY updated_at DESC, created_at DESC")
      .all() as Record<string, unknown>[];
    return rows.map(mapProduct);
  }

  async createProduct(input: ProductInput): Promise<CatalogItem> {
    const now = new Date().toISOString();
    const id = input.id?.trim() || `manual-${Date.now()}`;
    const title = input.title?.trim() || `${input.brand} ${input.model}`.trim();
    const description =
      input.description?.trim() ||
      `${input.brand} ${input.model}, ${input.cpu || "CPU by request"}, ${input.ramGb || ""}GB RAM, ${input.ssdGb || ""}GB SSD.`;

    sqlite
      .prepare(
        `INSERT OR REPLACE INTO products (
          id, created_at, updated_at, publish, category, subcategory, brand, model, title, description,
          cpu, ram_gb, ssd_gb, condition, quantity, price_aed, price_rub, price_status, availability,
          seller, whatsapp, location, lead_action, photo_url
        ) VALUES (
          @id,
          COALESCE((SELECT created_at FROM products WHERE id = @id), @now),
          @now,
          'yes',
          @category,
          @subcategory,
          @brand,
          @model,
          @title,
          @description,
          @cpu,
          @ramGb,
          @ssdGb,
          @condition,
          @quantity,
          @priceAed,
          @priceRub,
          @priceStatus,
          @availability,
          @seller,
          @whatsapp,
          @location,
          @leadAction,
          @photoUrl
        )`,
      )
      .run({
        id,
        now,
        category: input.category || "Laptop",
        subcategory: input.subcategory || "",
        brand: input.brand,
        model: input.model,
        title,
        description,
        cpu: input.cpu || "",
        ramGb: String(input.ramGb || ""),
        ssdGb: String(input.ssdGb || ""),
        condition: input.condition || "",
        quantity: String(input.quantity || ""),
        priceAed: String(input.priceAed || ""),
        priceRub: String(input.priceRub || ""),
        priceStatus: input.priceStatus || "By request",
        availability: input.availability || "Check availability",
        seller: input.seller || "",
        whatsapp: normalizeWhatsApp(input.whatsapp),
        location: input.location || "UAE",
        leadAction: input.leadAction || "Request price",
        photoUrl: input.photoUrl || "",
      });

    const row = sqlite.prepare("SELECT * FROM products WHERE id = ?").get(id) as Record<string, unknown>;
    return mapProduct(row);
  }

  async listSuppliers(): Promise<Supplier[]> {
    const rows = sqlite
      .prepare("SELECT * FROM suppliers ORDER BY id DESC LIMIT 200")
      .all() as Record<string, unknown>[];
    return rows.map(mapSupplier);
  }

  async createSupplier(input: SupplierInput): Promise<Supplier> {
    const createdAt = new Date().toISOString();
    const result = sqlite
      .prepare(
        `INSERT INTO suppliers (
          created_at, status, name, contact, company, location, whatsapp, categories, notes
        ) VALUES (
          @createdAt, 'new', @name, @contact, @company, @location, @whatsapp, @categories, @notes
        )`,
      )
      .run({
        createdAt,
        name: input.name,
        contact: input.contact,
        company: input.company || "",
        location: input.location || "UAE",
        whatsapp: normalizeWhatsApp(input.whatsapp),
        categories: input.categories || "",
        notes: input.notes || "",
      });

    const row = sqlite.prepare("SELECT * FROM suppliers WHERE id = ?").get(result.lastInsertRowid) as Record<
      string,
      unknown
    >;
    return mapSupplier(row);
  }

  async countSuppliers(): Promise<number> {
    const row = sqlite.prepare("SELECT COUNT(*) as count FROM suppliers").get() as { count: number };
    return row.count;
  }
}

export const storage = new DatabaseStorage();
