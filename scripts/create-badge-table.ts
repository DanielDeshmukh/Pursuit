import "dotenv/config";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  await client.execute("DROP TABLE IF EXISTS badge_data");
  await client.execute(`
    CREATE TABLE IF NOT EXISTS badge_data (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      photo TEXT,
      first_name TEXT,
      overall INTEGER,
      position TEXT,
      flag TEXT,
      proj INTEGER,
      tech INTEGER,
      cont INTEGER,
      yexp INTEGER,
      cert INTEGER,
      lang INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  console.log("badge_data table created successfully");
}

main().catch(console.error);
