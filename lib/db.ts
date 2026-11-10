import "server-only";
import { Pool, type QueryResultRow } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __mnhPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL est manquant dans .env.local");
  }
  return new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
}

// Un seul Pool réutilisé (évite trop de connexions en dev / hot reload)
export const pool: Pool = globalThis.__mnhPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalThis.__mnhPool = pool;

/** Requête paramétrée uniquement : query("SELECT * FROM x WHERE id = $1", [id]) */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
) {
  return pool.query<T>(text, params);
}