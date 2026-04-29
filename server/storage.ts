import Database from "better-sqlite3";
import type {
  CargoRequest,
  CargoRequestInput,
  CatalogItem,
  InspectionReport,
  InspectionReportInput,
  Inspector,
  InspectorInput,
  Lead,
  LeadInput,
  ProductInput,
  Supplier,
  SupplierInput,
} from "@shared/schema";

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

sqlite
  .prepare(
    `CREATE TABLE IF NOT EXISTS inspectors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      name TEXT NOT NULL,
      contact TEXT NOT NULL,
      location TEXT,
      languages TEXT,
      price_aed TEXT,
      rating TEXT,
      completed_checks TEXT,
      availability TEXT,
      notes TEXT
    )`,
  )
  .run();

sqlite
  .prepare(
    `CREATE TABLE IF NOT EXISTS inspection_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'sent',
      lead_id TEXT,
      product_title TEXT NOT NULL,
      inspector_name TEXT NOT NULL,
      supplier_name TEXT,
      serial_number TEXT,
      display_test TEXT,
      temperature_test TEXT,
      ports_test TEXT,
      keyboard_test TEXT,
      battery_test TEXT,
      photos_link TEXT,
      verdict TEXT,
      comments TEXT
    )`,
  )
  .run();

sqlite
  .prepare(
    `CREATE TABLE IF NOT EXISTS cargo_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      product_id TEXT,
      product_title TEXT,
      buyer_name TEXT NOT NULL,
      buyer_contact TEXT NOT NULL,
      city_rf TEXT,
      delivery_address_rf TEXT,
      item_price_aed TEXT,
      quantity TEXT,
      supplier_contact TEXT,
      supplier_address_uae TEXT,
      payment_method TEXT,
      comments TEXT
    )`,
  )
  .run();

const inspectorCount = sqlite.prepare("SELECT COUNT(*) as count FROM inspectors").get() as { count: number };
if (inspectorCount.count === 0) {
  const createdAt = new Date().toISOString();
  const seedInspectors = [
    {
      name: "Ali",
      contact: "+971 50 111 2233",
      location: "Sharjah / Dubai",
      languages: "EN / RU basic",
      priceAed: "120",
      rating: "5.0",
      completedChecks: "0",
      availability: "Today / tomorrow",
      notes: "Laptop visual check, photos, basic diagnostics.",
    },
    {
      name: "Timur",
      contact: "+971 55 332 1100",
      location: "Dubai / Deira",
      languages: "RU / EN",
      priceAed: "150",
      rating: "5.0",
      completedChecks: "0",
      availability: "By appointment",
      notes: "Detailed laptop checks for RF buyers.",
    },
    {
      name: "Omar",
      contact: "+971 52 909 7788",
      location: "Sharjah",
      languages: "EN / AR",
      priceAed: "100",
      rating: "5.0",
      completedChecks: "0",
      availability: "Same day if nearby",
      notes: "Store visit and checklist report.",
    },
  ];
  const insertInspector = sqlite.prepare(
    `INSERT INTO inspectors (
      created_at, status, name, contact, location, languages, price_aed, rating, completed_checks, availability, notes
    ) VALUES (
      @createdAt, 'active', @name, @contact, @location, @languages, @priceAed, @rating, @completedChecks, @availability, @notes
    )`,
  );
  for (const inspector of seedInspectors) {
    insertInspector.run({ createdAt, ...inspector });
  }
}

export interface IStorage {
  createLead(input: LeadInput): Promise<Lead>;
  listLeads(): Promise<Lead[]>;
  countLeads(): Promise<number>;
  listProducts(): Promise<CatalogItem[]>;
  createProduct(input: ProductInput): Promise<CatalogItem>;
  listSuppliers(): Promise<Supplier[]>;
  createSupplier(input: SupplierInput): Promise<Supplier>;
  countSuppliers(): Promise<number>;
  listInspectors(): Promise<Inspector[]>;
  createInspector(input: InspectorInput): Promise<Inspector>;
  listInspectionReports(): Promise<InspectionReport[]>;
  createInspectionReport(input: InspectionReportInput): Promise<InspectionReport>;
  listCargoRequests(): Promise<CargoRequest[]>;
  createCargoRequest(input: CargoRequestInput): Promise<CargoRequest>;
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

function mapInspector(row: Record<string, unknown>): Inspector {
  return {
    id: Number(row.id),
    createdAt: String(row.created_at),
    status: String(row.status) as Inspector["status"],
    name: String(row.name),
    contact: String(row.contact),
    location: String(row.location || "UAE"),
    languages: String(row.languages || ""),
    priceAed: String(row.price_aed || ""),
    rating: String(row.rating || "5.0"),
    completedChecks: String(row.completed_checks || "0"),
    availability: String(row.availability || ""),
    notes: String(row.notes || ""),
  };
}

function mapInspectionReport(row: Record<string, unknown>): InspectionReport {
  return {
    id: Number(row.id),
    createdAt: String(row.created_at),
    status: String(row.status) as InspectionReport["status"],
    leadId: String(row.lead_id || ""),
    productTitle: String(row.product_title || ""),
    inspectorName: String(row.inspector_name || ""),
    supplierName: String(row.supplier_name || ""),
    serialNumber: String(row.serial_number || ""),
    displayTest: String(row.display_test || ""),
    temperatureTest: String(row.temperature_test || ""),
    portsTest: String(row.ports_test || ""),
    keyboardTest: String(row.keyboard_test || ""),
    batteryTest: String(row.battery_test || ""),
    photosLink: String(row.photos_link || ""),
    verdict: String(row.verdict || "conditional") as InspectionReport["verdict"],
    comments: String(row.comments || ""),
  };
}

function mapCargoRequest(row: Record<string, unknown>): CargoRequest {
  return {
    id: Number(row.id),
    createdAt: String(row.created_at),
    status: String(row.status) as CargoRequest["status"],
    productId: String(row.product_id || ""),
    productTitle: String(row.product_title || ""),
    buyerName: String(row.buyer_name || ""),
    buyerContact: String(row.buyer_contact || ""),
    cityRf: String(row.city_rf || ""),
    deliveryAddressRf: String(row.delivery_address_rf || ""),
    itemPriceAed: String(row.item_price_aed || ""),
    quantity: String(row.quantity || ""),
    supplierContact: String(row.supplier_contact || ""),
    supplierAddressUae: String(row.supplier_address_uae || ""),
    paymentMethod: String(row.payment_method || ""),
    comments: String(row.comments || ""),
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

  async listInspectors(): Promise<Inspector[]> {
    const rows = sqlite
      .prepare("SELECT * FROM inspectors ORDER BY status = 'active' DESC, rating DESC, id ASC LIMIT 200")
      .all() as Record<string, unknown>[];
    return rows.map(mapInspector);
  }

  async createInspector(input: InspectorInput): Promise<Inspector> {
    const createdAt = new Date().toISOString();
    const result = sqlite
      .prepare(
        `INSERT INTO inspectors (
          created_at, status, name, contact, location, languages, price_aed, rating, completed_checks, availability, notes
        ) VALUES (
          @createdAt, 'active', @name, @contact, @location, @languages, @priceAed, @rating, @completedChecks, @availability, @notes
        )`,
      )
      .run({
        createdAt,
        name: input.name,
        contact: input.contact,
        location: input.location || "UAE",
        languages: input.languages || "RU / EN",
        priceAed: String(input.priceAed || ""),
        rating: String(input.rating || "5.0"),
        completedChecks: String(input.completedChecks || "0"),
        availability: input.availability || "Today / tomorrow",
        notes: input.notes || "",
      });

    const row = sqlite.prepare("SELECT * FROM inspectors WHERE id = ?").get(result.lastInsertRowid) as Record<
      string,
      unknown
    >;
    return mapInspector(row);
  }

  async listInspectionReports(): Promise<InspectionReport[]> {
    const rows = sqlite
      .prepare("SELECT * FROM inspection_reports ORDER BY id DESC LIMIT 200")
      .all() as Record<string, unknown>[];
    return rows.map(mapInspectionReport);
  }

  async createInspectionReport(input: InspectionReportInput): Promise<InspectionReport> {
    const createdAt = new Date().toISOString();
    const result = sqlite
      .prepare(
        `INSERT INTO inspection_reports (
          created_at, status, lead_id, product_title, inspector_name, supplier_name, serial_number,
          display_test, temperature_test, ports_test, keyboard_test, battery_test, photos_link, verdict, comments
        ) VALUES (
          @createdAt, 'sent', @leadId, @productTitle, @inspectorName, @supplierName, @serialNumber,
          @displayTest, @temperatureTest, @portsTest, @keyboardTest, @batteryTest, @photosLink, @verdict, @comments
        )`,
      )
      .run({
        createdAt,
        leadId: String(input.leadId || ""),
        productTitle: input.productTitle,
        inspectorName: input.inspectorName,
        supplierName: input.supplierName || "",
        serialNumber: input.serialNumber || "",
        displayTest: input.displayTest || "Not checked",
        temperatureTest: input.temperatureTest || "Not checked",
        portsTest: input.portsTest || "Not checked",
        keyboardTest: input.keyboardTest || "Not checked",
        batteryTest: input.batteryTest || "Not checked",
        photosLink: input.photosLink || "",
        verdict: input.verdict || "conditional",
        comments: input.comments || "",
      });

    const row = sqlite.prepare("SELECT * FROM inspection_reports WHERE id = ?").get(result.lastInsertRowid) as Record<
      string,
      unknown
    >;
    return mapInspectionReport(row);
  }

  async listCargoRequests(): Promise<CargoRequest[]> {
    const rows = sqlite
      .prepare("SELECT * FROM cargo_requests ORDER BY id DESC LIMIT 200")
      .all() as Record<string, unknown>[];
    return rows.map(mapCargoRequest);
  }

  async createCargoRequest(input: CargoRequestInput): Promise<CargoRequest> {
    const createdAt = new Date().toISOString();
    const result = sqlite
      .prepare(
        `INSERT INTO cargo_requests (
          created_at, status, product_id, product_title, buyer_name, buyer_contact, city_rf, delivery_address_rf,
          item_price_aed, quantity, supplier_contact, supplier_address_uae, payment_method, comments
        ) VALUES (
          @createdAt, 'new', @productId, @productTitle, @buyerName, @buyerContact, @cityRf, @deliveryAddressRf,
          @itemPriceAed, @quantity, @supplierContact, @supplierAddressUae, @paymentMethod, @comments
        )`,
      )
      .run({
        createdAt,
        productId: input.productId || "",
        productTitle: input.productTitle || "",
        buyerName: input.buyerName,
        buyerContact: input.buyerContact,
        cityRf: input.cityRf || "",
        deliveryAddressRf: input.deliveryAddressRf || "",
        itemPriceAed: String(input.itemPriceAed || ""),
        quantity: String(input.quantity || ""),
        supplierContact: input.supplierContact || "",
        supplierAddressUae: input.supplierAddressUae || "",
        paymentMethod: input.paymentMethod || "",
        comments: input.comments || "",
      });

    const row = sqlite.prepare("SELECT * FROM cargo_requests WHERE id = ?").get(result.lastInsertRowid) as Record<
      string,
      unknown
    >;
    return mapCargoRequest(row);
  }
}

export const storage = new DatabaseStorage();
