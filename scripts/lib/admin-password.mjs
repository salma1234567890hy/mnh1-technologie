// scripts/lib/admin-password.mjs
// Outils partagés par scripts/create-admin.mjs et scripts/reset-admin-password.mjs :
// génération d'un mot de passe aléatoire robuste et empreinte argon2id vérifiée (RG25, RG26).

import { randomInt } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";

/**
 * ⚠️ Ces valeurs doivent rester STRICTEMENT IDENTIQUES à ARGON2_OPTIONS dans lib/auth/password.ts.
 * (Les scripts sont en .mjs et ne peuvent pas importer ce module TypeScript "server-only".)
 * algorithm 2 = Argon2id · version 1 = 0x13 (version 19) · 19 Mio · 2 itérations · parallélisme 1.
 */
export const ARGON2_OPTIONS = {
  algorithm: 2,
  version: 1,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
};

/** Préfixe attendu d'une empreinte produite avec ARGON2_OPTIONS. */
const EXPECTED_HASH_PREFIX = "$argon2id$v=19$m=19456,t=2,p=1$";

const PASSWORD_LENGTH = 24;
const LOWER = "abcdefghijkmnopqrstuvwxyz"; // sans « l » (confusion avec 1 / I)
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // sans « I » ni « O »
const DIGITS = "23456789"; // sans 0 ni 1
const SYMBOLS = "!@#$%^&*()-_=+[]{}:,.?~"; // sans espace, guillemets ni barre oblique inverse
const ALL_CHARS = LOWER + UPPER + DIGITS + SYMBOLS;

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Caractère tiré uniformément (randomInt de node:crypto : sans biais de modulo). */
function pick(chars) {
  return chars[randomInt(chars.length)];
}

/** Mot de passe aléatoire de 24 caractères : au moins une minuscule, une majuscule, un chiffre et un symbole. */
export function generatePassword() {
  const chars = [pick(LOWER), pick(UPPER), pick(DIGITS), pick(SYMBOLS)];
  while (chars.length < PASSWORD_LENGTH) chars.push(pick(ALL_CHARS));
  // Mélange de Fisher-Yates : les 4 caractères obligatoires ne restent pas en tête.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

/**
 * Calcule l'empreinte argon2id du mot de passe, puis la contrôle AVANT tout enregistrement :
 * paramètres attendus et vérification réussie avec le mot de passe. Lève une erreur sinon.
 */
export async function hashAndVerifyPassword(password) {
  const passwordHash = await hash(password, ARGON2_OPTIONS);

  if (!passwordHash.startsWith(EXPECTED_HASH_PREFIX)) {
    throw new Error("L'empreinte produite n'a pas les paramètres attendus.");
  }
  if (!(await verify(passwordHash, password))) {
    throw new Error("L'empreinte produite n'est pas vérifiable.");
  }
  return passwordHash;
}

/** Affiche le mot de passe UNE SEULE FOIS, avec l'avertissement de le conserver (jamais écrit ailleurs). */
export function printPasswordOnce(password) {
  console.log("");
  console.log("   Mot de passe (affiché une seule fois) :");
  console.log("");
  console.log(`   ${password}`);
  console.log("");
  console.log("⚠️  Conservez-le immédiatement en lieu sûr (gestionnaire de mots de passe).");
  console.log("   Il n'est enregistré nulle part et ne pourra pas être affiché de nouveau.");
}
