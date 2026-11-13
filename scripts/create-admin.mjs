// scripts/create-admin.mjs
// Procédure contrôlée de création d'un compte Admin (RG25 : aucune inscription publique).
// Génère un mot de passe aléatoire robuste, le hache en argon2id (RG26) et insère le compte.
// Utilise le rôle propriétaire (MIGRATION_DATABASE_URL) : mnh_app n'a pas le droit d'INSERT sur admin_user.
// Lancement : npm run admin:create -- --email <email> --name "<nom complet>"
//
// Le mot de passe est affiché UNE SEULE FOIS dans le terminal : il n'est écrit dans aucun fichier ni log.
// Génération et paramètres argon2id : scripts/lib/admin-password.mjs (partagé avec reset-admin-password.mjs).

import { parseArgs } from "node:util";
import pg from "pg";
import {
  EMAIL_PATTERN,
  generatePassword,
  hashAndVerifyPassword,
  printPasswordOnce,
} from "./lib/admin-password.mjs";

const USAGE = 'Utilisation : npm run admin:create -- --email <email> --name "<nom complet>"';

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

// 1. Lecture et validation des arguments
let values;
try {
  ({ values } = parseArgs({
    options: { email: { type: "string" }, name: { type: "string" } },
    strict: true,
  }));
} catch (error) {
  fail(`${error.message}\n   ${USAGE}`);
}

const email = (values.email ?? "").trim().toLowerCase();
const fullName = (values.name ?? "").trim();

if (!email || !fullName) {
  fail(`Arguments manquants.\n   ${USAGE}`);
}
if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
  fail(`Adresse e-mail invalide : ${email}`);
}
if (fullName.length < 2 || fullName.length > 100) {
  fail("Le nom complet doit comporter 2 à 100 caractères.");
}

const connectionString = process.env.MIGRATION_DATABASE_URL;
if (!connectionString) {
  fail("MIGRATION_DATABASE_URL est manquant dans .env.local");
}

// 2. Mot de passe et empreinte argon2id, contrôlée AVANT toute insertion
const password = generatePassword();
let passwordHash;
try {
  passwordHash = await hashAndVerifyPassword(password);
} catch (error) {
  fail(`${error.message} Aucun compte créé.`);
}

// 3. Insertion (refus clair si l'email existe déjà)
const client = new pg.Client({ connectionString });
try {
  await client.connect();

  const { rows } = await client.query(
    `INSERT INTO admin_user (email, full_name, password_hash)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO NOTHING
     RETURNING id`,
    [email, fullName, passwordHash]
  );

  if (rows.length === 0) {
    fail(`Un compte existe déjà pour ${email} : aucun compte créé.`);
  }

  console.log(`✅ Compte Admin créé (id ${rows[0].id}) : ${fullName} <${email}>`);
  printPasswordOnce(password);
} catch (error) {
  // Message sans le mot de passe ni l'empreinte.
  fail(`Création du compte impossible : ${error.message}`);
} finally {
  await client.end().catch(() => {});
}
