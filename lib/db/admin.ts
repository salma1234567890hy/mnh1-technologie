// lib/db/admin.ts
// Accès aux données : comptes Admin, sessions et journal d'audit (RG25 à RG29).
// Rôle mnh_app : il ne met à jour QUE les colonnes autorisées par db/migrations/007_grants.sql
//   - admin_user    : failed_login_count, locked_until, last_login_at
//   - admin_session : last_activity_at, revoked_at
// Requêtes SQL paramétrées uniquement ($1, $2…) — aucune concaténation de valeurs.

import type { PoolClient } from "pg";
import { query } from "@/lib/db";

/** Nombre d'échecs consécutifs avant verrouillage, et durée du verrouillage (RG27). */
export const MAX_FAILED_LOGINS = 5;
export const LOCK_DURATION_MINUTES = 15;

/** Durée d'inactivité au-delà de laquelle une session expire (RG28). */
export const SESSION_IDLE_TIMEOUT_MINUTES = 30;

/** Compte Admin tel que lu pour la connexion (contient l'empreinte : ne jamais le renvoyer au client). */
export type AdminCredentials = {
  id: number;
  email: string;
  full_name: string;
  password_hash: string;
  is_active: boolean;
  failed_login_count: number;
  locked_until: Date | null;
};

/** Admin connecté, sans aucune donnée sensible. */
export type AdminIdentity = {
  id: number;
  email: string;
  full_name: string;
};

export type AdminSession = {
  id: string;
  admin_user_id: number;
  created_at: Date;
  last_activity_at: Date;
  expires_at: Date;
};

/** Actions autorisées par la contrainte admin_audit_log_action_chk (db/migrations/005_audit.sql). */
export type AdminAction =
  | "LOGIN"
  | "LOGOUT"
  | "DOWNLOAD_CV"
  | "DOWNLOAD_COVER_LETTER"
  | "UPDATE_APPLICATION_STATUS"
  | "CREATE_OFFER"
  | "UPDATE_OFFER"
  | "PUBLISH_OFFER"
  | "DEACTIVATE_OFFER"
  | "ARCHIVE_OFFER";

/** Compte Admin par email (comparé en minuscules, comme la contrainte admin_user_email_lower_chk). */
export async function findAdminByEmail(email: string): Promise<AdminCredentials | null> {
  if (typeof email !== "string" || email.length === 0 || email.length > 254) return null;

  const { rows } = await query<AdminCredentials>(
    `SELECT id, email, full_name, password_hash, is_active, failed_login_count, locked_until
     FROM admin_user
     WHERE email = $1
     LIMIT 1`,
    [email.trim().toLowerCase()]
  );
  return rows[0] ?? null;
}

/**
 * Enregistre un échec de connexion, en UNE requête atomique (les valeurs de droite sont celles AVANT la mise à jour) :
 * - verrouillage en cours (locked_until > now()) : rien ne change (le verrou n'est pas prolongé) ;
 * - verrouillage précédent expiré : le compteur repart de 1 et le verrou est levé ;
 * - sinon : compteur + 1, et verrouillage de 15 minutes au 5e échec consécutif.
 * Renvoie l'état obtenu, ou null si le compte n'existe pas.
 */
export async function recordFailedLogin(
  adminId: number
): Promise<{ failed_login_count: number; locked_until: Date | null } | null> {
  const { rows } = await query<{ failed_login_count: number; locked_until: Date | null }>(
    `UPDATE admin_user
     SET
       failed_login_count = CASE
         WHEN locked_until > now() THEN failed_login_count
         WHEN locked_until IS NOT NULL THEN 1
         ELSE failed_login_count + 1
       END,
       locked_until = CASE
         WHEN locked_until > now() THEN locked_until
         WHEN locked_until IS NOT NULL THEN NULL
         WHEN failed_login_count + 1 >= $2 THEN now() + make_interval(mins => $3)
         ELSE NULL
       END
     WHERE id = $1
     RETURNING failed_login_count, locked_until`,
    [adminId, MAX_FAILED_LOGINS, LOCK_DURATION_MINUTES]
  );
  return rows[0] ?? null;
}

/** Connexion réussie : remise à zéro du compteur, levée du verrou, date de dernière connexion. */
export async function recordSuccessfulLogin(adminId: number): Promise<void> {
  await query(
    `UPDATE admin_user
     SET failed_login_count = 0, locked_until = NULL, last_login_at = now()
     WHERE id = $1`,
    [adminId]
  );
}

/** Crée une session. Seule l'empreinte SHA-256 du jeton est stockée, jamais le jeton (RG28). */
export async function createSession(adminId: number, tokenHash: string, expiresAt: Date): Promise<string> {
  const { rows } = await query<{ id: string }>(
    `INSERT INTO admin_session (admin_user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [adminId, tokenHash, expiresAt]
  );
  return rows[0].id;
}

/**
 * Session valide et son Admin, ou null. Une session est valide si (RG28, RG29) :
 * non révoquée · expires_at > now() · dernière activité il y a moins de 30 minutes · Admin actif.
 * Le password_hash n'est jamais lu ici.
 */
export async function findValidSession(
  tokenHash: string
): Promise<{ session: AdminSession; admin: AdminIdentity } | null> {
  if (typeof tokenHash !== "string" || tokenHash.length === 0 || tokenHash.length > 128) return null;

  const { rows } = await query<AdminSession & { admin_email: string; admin_full_name: string }>(
    `SELECT s.id, s.admin_user_id, s.created_at, s.last_activity_at, s.expires_at,
            u.email AS admin_email, u.full_name AS admin_full_name
     FROM admin_session s
     JOIN admin_user u ON u.id = s.admin_user_id
     WHERE s.token_hash = $1
       AND s.revoked_at IS NULL
       AND s.expires_at > now()
       AND s.last_activity_at > now() - make_interval(mins => $2)
       AND u.is_active = true
     LIMIT 1`,
    [tokenHash, SESSION_IDLE_TIMEOUT_MINUTES]
  );

  const row = rows[0];
  if (!row) return null;

  return {
    session: {
      id: row.id,
      admin_user_id: row.admin_user_id,
      created_at: row.created_at,
      last_activity_at: row.last_activity_at,
      expires_at: row.expires_at,
    },
    admin: { id: row.admin_user_id, email: row.admin_email, full_name: row.admin_full_name },
  };
}

/** Prolonge l'activité d'une session non révoquée (expiration après 30 min d'inactivité). */
export async function touchSession(sessionId: string): Promise<void> {
  await query(
    `UPDATE admin_session
     SET last_activity_at = now()
     WHERE id = $1 AND revoked_at IS NULL`,
    [sessionId]
  );
}

/**
 * Révoque une session (déconnexion). Renvoie l'identifiant de l'Admin concerné,
 * ou null si aucune session active ne correspond (déjà révoquée ou inexistante).
 */
export async function revokeSession(tokenHash: string): Promise<number | null> {
  if (typeof tokenHash !== "string" || tokenHash.length === 0 || tokenHash.length > 128) return null;

  const { rows } = await query<{ admin_user_id: number }>(
    `UPDATE admin_session
     SET revoked_at = now()
     WHERE token_hash = $1 AND revoked_at IS NULL
     RETURNING admin_user_id`,
    [tokenHash]
  );
  return rows[0]?.admin_user_id ?? null;
}

/**
 * Détails structurés d'une action (colonne admin_audit_log.metadata, migration 009).
 * RÈGLE : JAMAIS de donnée personnelle (nom, email, téléphone, nom de fichier) —
 * uniquement des statuts, identifiants et codes. Contrôlé par assertSafeAuditMetadata.
 */
export type AuditMetadata = Record<string, string | number | boolean | null | readonly string[]>;

/**
 * Textes acceptés dans metadata : codes en MAJUSCULES (ex. "EN_ATTENTE", "CV"), 64 caractères maximum,
 * seuls ou en liste (ex. fields: ["TITLE", "LOCATION"]).
 */
const AUDIT_CODE_PATTERN = /^[A-Z0-9_]{1,64}$/;
const AUDIT_KEY_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]{0,31}$/;

/**
 * Refuse toute metadata qui pourrait contenir une donnée personnelle : clés simples,
 * valeurs limitées aux nombres, booléens, null et codes en majuscules (un email, un nom
 * ou un nom de fichier ne passent pas). Lève une erreur : c'est une erreur de programmation.
 */
function assertSafeAuditMetadata(metadata: AuditMetadata): void {
  const entries = Object.entries(metadata);
  if (entries.length > 20) throw new Error("metadata d'audit trop volumineuse");
  for (const [key, value] of entries) {
    if (!AUDIT_KEY_PATTERN.test(key)) throw new Error("Clé de metadata d'audit invalide");
    const ok =
      value === null ||
      typeof value === "boolean" ||
      (typeof value === "number" && Number.isFinite(value)) ||
      (typeof value === "string" && AUDIT_CODE_PATTERN.test(value)) ||
      // Liste de codes (ex. fields: ["TITLE", "LOCATION"]) : mêmes règles, 20 éléments au maximum.
      (Array.isArray(value) &&
        value.length <= 20 &&
        value.every((item) => typeof item === "string" && AUDIT_CODE_PATTERN.test(item)));
    if (!ok) throw new Error("Valeur de metadata d'audit refusée (codes, statuts et identifiants uniquement)");
  }
}

export type LogAdminActionOptions = {
  /** Client d'une transaction en cours (withTransaction) : l'écriture est annulée avec elle. */
  client?: PoolClient;
  /** Détails sans donnée personnelle, ex. { from: "EN_ATTENTE", to: "ACCEPTEE" }. */
  metadata?: AuditMetadata;
};

/**
 * Ajoute une ligne au journal d'audit (ex. LOGIN, LOGOUT, UPDATE_APPLICATION_STATUS).
 * Sans options.client : requête autonome sur le Pool.
 */
export async function logAdminAction(
  adminId: number,
  action: AdminAction,
  entityType?: string,
  entityId?: number,
  options: LogAdminActionOptions = {}
): Promise<void> {
  if (options.metadata) assertSafeAuditMetadata(options.metadata);

  const text = `INSERT INTO admin_audit_log (admin_user_id, action, entity_type, entity_id, metadata)
     VALUES ($1, $2, $3, $4, $5::jsonb)`;
  const params = [
    adminId,
    action,
    entityType ?? null,
    entityId ?? null,
    options.metadata ? JSON.stringify(options.metadata) : null,
  ];
  if (options.client) {
    await options.client.query(text, params);
  } else {
    await query(text, params);
  }
}
