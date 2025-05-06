import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// In development, use SQLite in-memory database
const isDevelopment = process.env.NODE_ENV === 'development';

let pool: Pool | undefined;
let db: any;

async function initializeDatabase() {
  if (isDevelopment) {
    console.log('Development mode: Using in-memory SQLite database');
    const { drizzle: drizzleSqlite } = await import('drizzle-orm/better-sqlite3');
    const Database = (await import('better-sqlite3')).default;
    db = drizzleSqlite(new Database(':memory:'));
  } else {
    // Production mode: Use PostgreSQL if available, otherwise skip
    if (process.env.DATABASE_URL) {
      console.log('Production mode: Using PostgreSQL database');
      pool = new Pool({ connectionString: process.env.DATABASE_URL });
      db = drizzle({ client: pool, schema });
    } else {
      console.log('Production mode: No PostgreSQL database configured, skipping');
      db = null;
    }
  }
}

// Initialize the database
await initializeDatabase();

export { pool, db };
