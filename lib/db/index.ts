import "server-only";
import { Pool, type PoolClient, type QueryResultRow } from "pg";

declare global {
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

/**
 * Exécute fn dans une transaction (BEGIN / COMMIT, ROLLBACK en cas d'erreur).
 * Toutes les requêtes de fn doivent passer par le client fourni : client.query<T>(text, params).
 * La connexion est toujours rendue au Pool, même en cas d'erreur.
 */
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
