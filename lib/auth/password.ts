// lib/auth/password.ts
// Hachage et vérification des mots de passe Admin (RG26, RG27).
// Seule l'empreinte argon2id est stockée en base, jamais le mot de passe.

import "server-only";
import { randomBytes } from "node:crypto";
import { hash, verify, type Algorithm, type Options, type Version } from "@node-rs/argon2";

/**
 * Paramètres argon2id recommandés par l'OWASP (Password Storage Cheat Sheet) :
 * 19 Mio de mémoire, 2 itérations, parallélisme 1.
 * Écrits explicitement pour ne pas dépendre des valeurs par défaut de la bibliothèque.
 * Algorithm et Version sont des « const enum » de la bibliothèque, inutilisables avec
 * isolatedModules : leurs valeurs sont donc écrites directement (cf. index.d.ts).
 */
const ARGON2_OPTIONS: Options = {
  algorithm: 2 as Algorithm, // Algorithm.Argon2id
  version: 1 as Version, // Version.V0x13 (version 19)
  memoryCost: 19_456, // en Kio (19 Mio)
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
};

/** Calcule l'empreinte argon2id d'un mot de passe (sel aléatoire inclus dans l'empreinte). */
export async function hashPassword(password: string): Promise<string> {
  if (typeof password !== "string" || password.length === 0) {
    throw new Error("Le mot de passe ne peut pas être vide.");
  }
  return hash(password, ARGON2_OPTIONS);
}

/**
 * Empreinte factice, calculée une seule fois au chargement du module avec les MÊMES paramètres.
 * Elle provient d'un secret aléatoire jamais conservé : aucun mot de passe ne peut la satisfaire.
 */
const dummyHashPromise: Promise<string> = hash(randomBytes(32).toString("base64"), ARGON2_OPTIONS);

/**
 * Vérification factice : prend le même temps qu'une vraie vérification et renvoie toujours false.
 * À utiliser quand le compte n'existe pas, est inactif ou verrouillé, pour qu'aucune mesure
 * du temps de réponse ne révèle si un email correspond à un compte (RG27).
 */
export async function verifyDummyPassword(password: string): Promise<false> {
  try {
    const dummyHash = await dummyHashPromise;
    await verify(dummyHash, typeof password === "string" ? password : "", ARGON2_OPTIONS);
  } catch {
    // Aucune erreur ne doit remonter : le résultat est false quoi qu'il arrive.
  }
  return false;
}

/**
 * Vérifie un mot de passe contre une empreinte argon2id (comparaison en temps constant par la bibliothèque).
 * Ne lève JAMAIS d'erreur : une empreinte invalide (ex. '!disabled' du compte de test,
 * qui provoque « Decoding failed ») renvoie false — après une vérification factice,
 * pour que ce cas prenne le même temps qu'un mot de passe incorrect.
 */
export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  if (typeof passwordHash !== "string" || typeof password !== "string" || password.length === 0) {
    return verifyDummyPassword(typeof password === "string" ? password : "");
  }
  try {
    return await verify(passwordHash, password, ARGON2_OPTIONS);
  } catch {
    return verifyDummyPassword(password);
  }
}
