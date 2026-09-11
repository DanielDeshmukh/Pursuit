import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

let client: Client | undefined;
let _db: ReturnType<typeof drizzle<typeof schema>> | undefined;

function getClient(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) {
      throw new Error("TURSO_DATABASE_URL is not set. Configure it in your environment.");
    }
    client = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return client;
}

export function getDb(): ReturnType<typeof drizzle<typeof schema>> {
  if (!_db) {
    _db = drizzle(getClient(), { schema });
  }
  return _db;
}

// Lazy proxy — the real db is only created when a property is first accessed.
// This prevents module-import-time crashes when env vars are empty (CI builds).
export const db: ReturnType<typeof drizzle<typeof schema>> = new Proxy(
  {} as ReturnType<typeof drizzle<typeof schema>>,
  {
    get(_target, prop) {
      const realDb = getDb();
      const value = Reflect.get(realDb, prop);
      if (typeof value === "function") {
        return value.bind(realDb);
      }
      return value;
    },
  }
);
