import "dotenv/config";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const sql = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT,
    resume_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    website TEXT,
    industry TEXT,
    source TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id),
    name TEXT NOT NULL,
    role TEXT,
    email TEXT,
    linkedin_url TEXT,
    last_contacted_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    company_id TEXT NOT NULL REFERENCES companies(id),
    contact_id TEXT REFERENCES contacts(id),
    job_title TEXT NOT NULL,
    job_url TEXT,
    status TEXT NOT NULL DEFAULT 'SAVED',
    salary_min TEXT,
    salary_max TEXT,
    source TEXT,
    applied_at TEXT,
    resume_version_used TEXT,
    notes TEXT,
    next_follow_up_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS outreach_messages (
    id TEXT PRIMARY KEY,
    application_id TEXT NOT NULL REFERENCES applications(id),
    contact_id TEXT NOT NULL REFERENCES contacts(id),
    channel TEXT NOT NULL,
    subject TEXT,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'drafted',
    sent_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    application_id TEXT NOT NULL REFERENCES applications(id),
    type TEXT NOT NULL,
    due_at TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0
  )`,
  // Add new columns if they don't exist
  `ALTER TABLE applications ADD COLUMN salary_min TEXT`,
  `ALTER TABLE applications ADD COLUMN salary_max TEXT`,
  `ALTER TABLE applications ADD COLUMN source TEXT`,
];

async function main() {
  for (const s of sql) {
    try {
      await client.execute(s);
      console.log("OK:", s.split("\n")[0].trim());
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("duplicate column")) {
        console.log("SKIP:", s.split("\n")[0].trim(), "(already exists)");
      } else {
        console.error("ERR:", s.split("\n")[0].trim(), msg);
      }
    }
  }
  const tables = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table'"
  );
  console.log("\nTables:", tables.rows.map((r) => r.name).join(", "));
}

main().catch(console.error);
