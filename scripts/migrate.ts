import "dotenv/config";
import { promises as fs } from "node:fs";
import path from "node:path";

import { db } from "../src/lib/db";

async function ensureMigrationsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const rows = await db.query<{ filename: string }>(
    "SELECT filename FROM schema_migrations ORDER BY filename",
  );
  return new Set(rows.map((row) => row.filename));
}

async function applyMigration(filename: string, filePath: string) {
  const sql = await fs.readFile(filePath, "utf-8");

  await db.transaction(async (client) => {
    await client.query(sql);
    await client.query("INSERT INTO schema_migrations (filename, applied_at) VALUES ($1, NOW())", [
      filename,
    ]);
  });
}

async function migrate() {
  const migrationsDir = path.resolve(process.cwd(), "migrations");
  const files = await fs.readdir(migrationsDir);
  const sqlFiles = files.filter((file) => file.endsWith(".sql")).sort();

  if (sqlFiles.length === 0) {
    console.info("No migration files detected.");
    return;
  }

  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();

  for (const file of sqlFiles) {
    if (applied.has(file)) {
      console.info(`Skipping ${file} (already applied)`);
      continue;
    }

    const filePath = path.join(migrationsDir, file);
    console.info(`Applying migration ${file}...`);
    await applyMigration(file, filePath);
    console.info(`Migration ${file} applied.`);
  }
}

migrate()
  .then(async () => {
    console.info("Migration complete.");
    await db.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Migration failed:", error);
    await db.end();
    process.exit(1);
  });
