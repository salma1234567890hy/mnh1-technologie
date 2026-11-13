// lib/storage/index.ts
// Stockage privé des fichiers de candidature (CV, lettres de motivation).
// Les fichiers sont écrits HORS de public/, dans PRIVATE_STORAGE_DIR (par défaut "storage/private"),
// sous un nom aléatoire : le nom d'origine n'est JAMAIS utilisé sur le disque.
// La base ne contient que la clé de stockage (ex. "cv/<uuid>.pdf").

import "server-only";
import { randomUUID } from "node:crypto";
import { lstat, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

/** Taille maximale d'un fichier : 5 Mo (aligné sur la contrainte application_cv_size_chk). */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

export type StorageFolder = "cv" | "cover-letters";

const STORAGE_FOLDERS: readonly StorageFolder[] = ["cv", "cover-letters"];

/** Signature d'un vrai fichier PDF : les 5 premiers octets valent "%PDF-". */
const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46, 0x2d];

/** Seul format de clé accepté : "<dossier>/<uuid v4>.pdf". */
const STORAGE_KEY_PATTERN =
  /^(cv|cover-letters)\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.pdf$/;

/** Dossier racine privé, en chemin absolu. Refuse toute configuration qui pointerait dans public/. */
// « turbopackIgnore » : chemins calculés à l'exécution ; évite que le build trace tout le projet (dont storage/).
function getStorageRoot(): string {
  const root = path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.PRIVATE_STORAGE_DIR || "storage/private");
  const publicDir = path.resolve(/*turbopackIgnore: true*/ process.cwd(), "public");
  if (root === publicDir || root.startsWith(publicDir + path.sep)) {
    throw new Error("PRIVATE_STORAGE_DIR ne doit jamais se trouver dans le dossier public/");
  }
  return root;
}

/**
 * Transforme une clé de stockage en chemin absolu, après vérification.
 * Toute clé qui ne respecte pas le format attendu (ex. "../", chemin absolu, autre extension) est refusée.
 */
function resolveStorageKey(key: string): string {
  if (typeof key !== "string" || !STORAGE_KEY_PATTERN.test(key)) {
    throw new Error("Clé de stockage invalide");
  }
  const root = getStorageRoot();
  const fullPath = path.resolve(/*turbopackIgnore: true*/ root, key);
  // Seconde barrière : le chemin final doit rester strictement dans le dossier privé.
  if (!fullPath.startsWith(root + path.sep)) {
    throw new Error("Clé de stockage invalide");
  }
  return fullPath;
}

/**
 * Vérifie qu'un fichier est un vrai PDF de 5 Mo maximum.
 * Contrôle le contenu réel (signature "%PDF-"), pas l'extension ni le type MIME déclarés.
 * Renvoie un message d'erreur en français, ou null si le fichier est valide.
 */
export async function validatePdf(file: File): Promise<string | null> {
  if (!(file instanceof File)) return "Fichier manquant.";
  if (file.size === 0) return "Le fichier est vide.";
  if (file.size > MAX_FILE_SIZE) return "Le fichier dépasse la taille maximale de 5 Mo.";

  const header = new Uint8Array(await file.slice(0, PDF_SIGNATURE.length).arrayBuffer());
  const isPdf =
    header.length === PDF_SIGNATURE.length && PDF_SIGNATURE.every((byte, i) => header[i] === byte);
  if (!isPdf) return "Le fichier doit être un document PDF.";

  return null;
}

/**
 * Enregistre un PDF dans le dossier privé sous un nom aléatoire et renvoie sa clé de stockage.
 * Le fichier est revalidé ici : un fichier non conforme n'est jamais écrit sur le disque.
 */
export async function savePrivateFile(file: File, folder: StorageFolder): Promise<string> {
  if (!STORAGE_FOLDERS.includes(folder)) {
    throw new Error("Dossier de stockage invalide");
  }
  const validationError = await validatePdf(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const key = `${folder}/${randomUUID()}.pdf`;
  const fullPath = resolveStorageKey(key);

  await mkdir(path.dirname(fullPath), { recursive: true });
  // "wx" : échoue si le fichier existe déjà, aucun écrasement possible.
  await writeFile(fullPath, new Uint8Array(await file.arrayBuffer()), { flag: "wx" });

  return key;
}

/** Motif de refus d'une lecture : code technique, jamais de chemin ni de nom de fichier. */
export type PrivateFileFailure = "INVALID_KEY" | "FILE_MISSING" | "NOT_A_FILE" | "FILE_TOO_LARGE" | "INVALID_SIGNATURE";

export type PrivateFileReadResult =
  | { ok: true; data: Uint8Array; sizeBytes: number }
  | { ok: false; reason: PrivateFileFailure };

/**
 * Lit un fichier privé pour le servir au téléchargement (routes Admin uniquement).
 * - n'accepte QUE le format de clé généré par savePrivateFile ("<dossier>/<uuid v4>.pdf"),
 *   et, si expectedFolder est fourni, uniquement dans ce dossier ;
 * - vérifie que le chemin résolu reste à l'intérieur de PRIVATE_STORAGE_DIR (protection contre "../") ;
 * - refuse un lien symbolique, un dossier ou un fichier de plus de 5 Mo ;
 * - revérifie la signature "%PDF-" avant de renvoyer le contenu.
 * Renvoie { ok: false, reason: "FILE_MISSING" } si le fichier n'existe pas sur le disque.
 */
export async function readPrivateFile(key: string, expectedFolder?: StorageFolder): Promise<PrivateFileReadResult> {
  if (typeof key !== "string" || !STORAGE_KEY_PATTERN.test(key)) return { ok: false, reason: "INVALID_KEY" };
  if (expectedFolder && !key.startsWith(`${expectedFolder}/`)) return { ok: false, reason: "INVALID_KEY" };

  let fullPath: string;
  try {
    fullPath = resolveStorageKey(key);
  } catch {
    return { ok: false, reason: "INVALID_KEY" };
  }

  let stats;
  try {
    stats = await lstat(fullPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { ok: false, reason: "FILE_MISSING" };
    throw error;
  }
  if (!stats.isFile()) return { ok: false, reason: "NOT_A_FILE" }; // dossier ou lien symbolique
  if (stats.size > MAX_FILE_SIZE) return { ok: false, reason: "FILE_TOO_LARGE" };

  let data: Buffer;
  try {
    data = await readFile(fullPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { ok: false, reason: "FILE_MISSING" };
    throw error;
  }

  const isPdf = data.length >= PDF_SIGNATURE.length && PDF_SIGNATURE.every((byte, i) => data[i] === byte);
  if (!isPdf) return { ok: false, reason: "INVALID_SIGNATURE" };

  return { ok: true, data: new Uint8Array(data), sizeBytes: data.length };
}

/** Supprime un fichier privé. Ne lève pas d'erreur si le fichier n'existe pas. */
export async function deletePrivateFile(key: string): Promise<void> {
  const fullPath = resolveStorageKey(key);
  try {
    await unlink(fullPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
