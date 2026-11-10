// scripts/migrate.mjs
// Exécute les migrations SQL de db/migrations/ dans l'ordre (001, 002, …).
// Chaque fichier est appliqué une seule fois, dans une transaction, et enregistré
// dans la table schema_migrations. Utilise le rôle propriétaire (MIGRATION_DATABASE_URL).
// Lancement : npm run db:migrate

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const MIGRATIONS_DIR = path.resolve("db", "migrations");
const LOCK_ID = 727001; // verrou pour éviter deux exécutions en même temps

const connectionString = process.env.MIGRATION_DATABASE_URL;
if (!connectionString) {
  console.error("❌ MIGRATION_DATABASE_URL est manquant dans .env.local");
  process.exit(1);
}

const client = new pg.Client({ connectionString });

async function main() {
  await client.connect();
  await client.query("SELECT pg_advisory_lock($1)", [LOCK_ID]);

  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    text        PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const { rows } = await client.query("SELECT version FROM schema_migrations");
  const applied = new Set(rows.map((r) => r.version));

  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => /^\d{3}_.+\.sql$/.test(f))
    .sort();

  const pending = files.filter((f) => !applied.has(f));
  if (pending.length === 0) {
    console.log("✅ Base à jour : aucune migration à appliquer.");
    return;
  }

  for (const file of pending) {
    const sql = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log(`✅ ${file}`);
    } catch (error) {
      await client.query("ROLLBACK");
      console.error(`❌ Échec de ${file} : ${error.message}`);
      process.exitCode = 1;
      return;
    }
  }
  console.log(`🎉 ${pending.length} migration(s) appliquée(s).`);
}

main()
  .catch((error) => {
    console.error("❌ Erreur :", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end().catch(() => {});
  });

  