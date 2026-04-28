import Database from "better-sqlite3";
import type { Lead, LeadInput } from "@shared/schema";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

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

export interface IStorage {
  createLead(input: LeadInput): Promise<Lead>;
  listLeads(): Promise<Lead[]>;
  countLeads(): Promise<number>;
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
}

export const storage = new DatabaseStorage();
