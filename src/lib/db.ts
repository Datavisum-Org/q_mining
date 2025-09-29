import { neonConfig, Pool } from "@neondatabase/serverless";
import type { PoolClient, QueryResultRow } from "pg";

import { assertEnv } from "@/lib/utils";

neonConfig.fetchConnectionCache = true;

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 200;

const TRANSIENT_ERROR_CODES = new Set([
  "57P01",
  "57P02",
  "57P03",
  "53300",
  "53400",
  "08000",
  "08003",
  "08006",
  "08P01",
]);

function isTransientError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = (error as { code?: string }).code;
  const message = (error as { message?: string }).message ?? "";

  if (code && TRANSIENT_ERROR_CODES.has(code)) {
    return true;
  }

  return (
    message.includes("ECONNRESET") ||
    message.includes("Connection terminated") ||
    message.includes("socket hang up")
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class Database {
  private static instance: Database;

  private pool: Pool;

  private constructor() {
    const connectionString = assertEnv("DATABASE_URL");

    this.pool = new Pool({
      connectionString,
      ssl: true,
      max: 1,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
    });
  }

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params: unknown[] = [],
  ): Promise<T[]> {
    return this.withRetry(async () => {
      const start = Date.now();
      const result = await this.pool.query<T>(text, params);
      if (process.env.NODE_ENV !== "production") {
        console.info(`Query executed in ${Date.now() - start}ms`);
      }
      return result.rows as T[];
    });
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    return this.withRetry(async () => {
      const client = await this.pool.connect();
      try {
        await client.query("BEGIN");
        const result = await callback(client);
        await client.query("COMMIT");
        return result;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    });
  }

  async end(): Promise<void> {
    await this.pool.end();
  }

  private async withRetry<T>(operation: () => Promise<T>, attempt = 1): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= MAX_RETRIES || !isTransientError(error)) {
        throw error;
      }

      if (process.env.NODE_ENV !== "production") {
        console.warn(`Database operation failed (attempt ${attempt}). Retrying...`, error);
      }

      await delay(RETRY_DELAY_MS * attempt);
      return this.withRetry(operation, attempt + 1);
    }
  }
}

export const db = Database.getInstance();
