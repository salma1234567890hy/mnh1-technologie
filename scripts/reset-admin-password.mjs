// scripts/reset-admin-password.mjs
// Procédure contrôlée de réinitialisation du mot de passe d'un compte Admin existant (RG25, RG26).
// Génère un nouveau mot de passe, enregistre son empreinte argon2id, remet le compteur d'échecs à 0,
// lève le verrouillage et révoque toutes les sessions encore actives du compte.
// Utilise le rôle propriétaire (MIGRATION_DATABASE_URL) : mnh_app n'a pas le droit de modifier password_hash.
// Lancement : npm run admin:reset-password -- --email <email>
//
// Le mot de passe est affiché UNE SEULE FOIS dans le terminal : il n'est écrit dans aucun fichier ni log.
// Génération et paramètres argon2id : scripts/lib/admin-password.mjs (partagé avec create-admin.mjs).

import { parseArgs } from "node:util";
import pg from "pg";
import {
  EMAIL_PATTERN,
  generatePassword,
  hashAndVerifyPassword,
  printPasswordOnce,
} from "./lib/admin-password.mjs";

const USAGE = "Utilisation : npm run admin:reset-password -- --email <email>";

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

// 1. Lecture et validation des arguments
let values;
try {
  ({ values } = parseArgs({ options: { email: { type: "string" } }, strict: true }));
} catch (error) {
  fail(`${error.message}\n   ${USAGE}`);
}

const email = (values.email ?? "").trim().toLowerCase();
if (!email) {
  fail(`Argument manquant.\n   ${USAGE}`);
}
if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
  fail(`Adresse e-mail invalide : ${email}`);
}

const connectionString = process.env.MIGRATION_DATABASE_URL;
if (!connectionString) {
  fail("MIGRATION_DATABASE_URL est manquant dans .env.local");
}

// 2. Nouveau mot de passe et empreinte argon2id, contrôlée AVANT toute modification
const password = generatePassword();
let passwordHash;
try {
  passwordHash = await hashAndVerifyPassword(password);
} catch (error) {
  fail(`${error.message} Aucune modification effectuée.`);
}

// 3. Mise à jour du compte et révocation des sessions, dans une seule transaction
const client = new pg.Client({ connectionString });
let result;
try {
  await client.connect();
  await client.query("BEGIN");

  const updated = await client.query(
    `UPDATE admin_user
     SET password_hash = $2, failed_login_count = 0, locked_until = NULL
     WHERE email = $1
     RETURNING id, full_name, is_active`,
    [email, passwordHash]
  );

  if (updated.rows.length === 0) {
    await client.query("ROLLBACK");
    result = { notFound: true };
  } else {
    const admin = updated.rows[0];
    const revoked = await client.query(
      `UPDATE admin_session
       SET revoked_at = now()
       WHERE admin_user_id = $1 AND revoked_at IS NULL AND expires_at > now()`,
      [admin.id]
    );
    await client.query("COMMIT");
    result = { admin, revokedCount: revoked.rowCount };
  }
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  // Message sans le mot de passe ni l'empreinte.
  fail(`Réinitialisation impossible : ${error.message} Aucune modification effectuée.`);
} finally {
  await client.end().catch(() => {});
}

if (result.notFound) {
  fail(`Aucun compte Admin n'existe pour ${email} : aucune modification effectuée.`);
}

const { admin, revokedCount } = result;
console.log(`✅ Mot de passe réinitialisé (id ${admin.id}) : ${admin.full_name} <${email}>`);
console.log("   Compteur d'échecs remis à 0, verrouillage levé.");
console.log(`   Sessions actives révoquées : ${revokedCount}`);
if (!admin.is_active) {
  console.log("⚠️  Ce compte est INACTIF : la connexion restera refusée tant qu'il n'est pas réactivé.");
}
printPasswordOnce(password);
