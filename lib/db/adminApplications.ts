// lib/db/adminApplications.ts
// Accès aux données : gestion des candidatures côté Admin (BE-08).
// Rôle mnh_app : SELECT sur application ; UPDATE limité à status, status_updated_at, reviewed_by (007_grants.sql).
// Les chemins de stockage des fichiers ne sortent JAMAIS de ce module, sauf par getApplicationFile
// (usage interne, pour le téléchargement contrôlé).
// Requêtes SQL paramétrées uniquement ($1, $2…) : les valeurs reçues ne sont jamais concaténées.
// Seuls des fragments constants du code (tri choisi dans une liste fermée) sont insérés dans le SQL.

import "server-only";
import { query, withTransaction } from "@/lib/db";
import { logAdminAction } from "@/lib/db/admin";
import {
  isStatusTransitionAllowed,
  type ApplicationSort,
  type ApplicationStatus,
  type ListApplicationsQuery,
} from "@/lib/validations/adminApplications";

// ---------------------------------------------------------------- Types

export type ApplicationListItem = {
  id: number;
  fullName: string;
  email: string;
  offer: { id: number; title: string };
  status: ApplicationStatus;
  receivedAt: Date;
  hasCoverLetter: boolean;
};

export type ApplicationList = {
  items: ApplicationListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

/** Détail d'une candidature : AUCUN chemin ni nom de fichier stocké. */
export type ApplicationDetail = {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  message: string | null;
  status: ApplicationStatus;
  receivedAt: Date;
  statusUpdatedAt: Date;
  consent: { given: boolean; at: Date };
  reviewedBy: { id: number; fullName: string } | null;
  offer: { id: number; slug: string; title: string; status: string };
  files: {
    cv: { present: boolean; sizeBytes: number | null };
    /** Aucune colonne de taille pour la lettre de motivation. */
    coverLetter: { present: boolean };
  };
};

export type ApplicationFileKind = "cv" | "cover_letter";

/** Usage interne uniquement (téléchargement) : ne jamais renvoyer tel quel au client. */
export type ApplicationFile = {
  storageKey: string;
  downloadName: string;
  sizeBytes: number | null;
};

export type StatusUpdateResult =
  | { updated: true; from: ApplicationStatus; to: ApplicationStatus }
  | { updated: false; reason: "SAME_STATUS" | "TRANSITION_NOT_ALLOWED"; current: ApplicationStatus };

// ---------------------------------------------------------------- Outils

/** Échappe les caractères spéciaux de LIKE/ILIKE (\, % et _) : la recherche porte sur le texte littéral. */
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** Tri : fragment SQL choisi dans une liste FERMÉE (jamais une valeur reçue). */
const ORDER_BY: Record<ApplicationSort, string> = {
  recent: "a.created_at DESC, a.id DESC",
  oldest: "a.created_at ASC, a.id ASC",
};

/**
 * Filtres communs à la liste et au total : $1 statut, $2 offre, $3 motif ILIKE (déjà échappé), chacun facultatif.
 * ESCAPE '\' : avec standard_conforming_strings (défaut), '\' est bien une barre oblique inverse.
 */
const LIST_WHERE = `
  ($1::text IS NULL OR a.status = $1::text)
  AND ($2::int IS NULL OR a.job_offer_id = $2::int)
  AND ($3::text IS NULL OR a.full_name ILIKE $3::text ESCAPE '\\' OR a.email ILIKE $3::text ESCAPE '\\')`;

// ---------------------------------------------------------------- Requêtes

/** Liste paginée et filtrée des candidatures. */
export async function listApplications(filters: ListApplicationsQuery): Promise<ApplicationList> {
  const page = filters.page;
  const pageSize = filters.pageSize;
  const pattern = filters.q ? `%${escapeLikePattern(filters.q)}%` : null;
  const whereParams = [filters.status ?? null, filters.offerId ?? null, pattern];

  const [countResult, rowsResult] = await Promise.all([
    query<{ total: number }>(`SELECT count(*)::int AS total FROM application a WHERE ${LIST_WHERE}`, whereParams),
    query<{
      id: number;
      full_name: string;
      email: string;
      offer_id: number;
      offer_title: string;
      status: ApplicationStatus;
      created_at: Date;
      has_cover_letter: boolean;
    }>(
      `SELECT a.id, a.full_name, a.email, jo.id AS offer_id, jo.title AS offer_title, a.status, a.created_at,
              (a.cover_letter_storage_key IS NOT NULL) AS has_cover_letter
       FROM application a
       JOIN job_offer jo ON jo.id = a.job_offer_id
       WHERE ${LIST_WHERE}
       ORDER BY ${ORDER_BY[filters.sort] ?? ORDER_BY.recent}
       LIMIT $4 OFFSET $5`,
      [...whereParams, pageSize, (page - 1) * pageSize]
    ),
  ]);

  const total = countResult.rows[0].total;
  return {
    items: rowsResult.rows.map((r) => ({
      id: r.id,
      fullName: r.full_name,
      email: r.email,
      offer: { id: r.offer_id, title: r.offer_title },
      status: r.status,
      receivedAt: r.created_at,
      hasCoverLetter: r.has_cover_letter,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/** Détail complet d'une candidature, ou null si elle n'existe pas. */
export async function getApplicationById(id: number): Promise<ApplicationDetail | null> {
  const { rows } = await query<{
    id: number;
    full_name: string;
    email: string;
    phone: string;
    message: string | null;
    status: ApplicationStatus;
    created_at: Date;
    status_updated_at: Date;
    consent_data_processing: boolean;
    consented_at: Date;
    reviewer_id: number | null;
    reviewer_name: string | null;
    offer_id: number;
    offer_slug: string;
    offer_title: string;
    offer_status: string;
    has_cv: boolean;
    cv_size_bytes: number | null;
    has_cover_letter: boolean;
  }>(
    `SELECT a.id, a.full_name, a.email, a.phone, a.message, a.status, a.created_at, a.status_updated_at,
            a.consent_data_processing, a.consented_at,
            u.id AS reviewer_id, u.full_name AS reviewer_name,
            jo.id AS offer_id, jo.slug AS offer_slug, jo.title AS offer_title, jo.status AS offer_status,
            (a.cv_storage_key IS NOT NULL) AS has_cv, a.cv_size_bytes,
            (a.cover_letter_storage_key IS NOT NULL) AS has_cover_letter
     FROM application a
     JOIN job_offer jo ON jo.id = a.job_offer_id
     LEFT JOIN admin_user u ON u.id = a.reviewed_by
     WHERE a.id = $1`,
    [id]
  );

  const r = rows[0];
  if (!r) return null;

  return {
    id: r.id,
    fullName: r.full_name,
    email: r.email,
    phone: r.phone,
    message: r.message,
    status: r.status,
    receivedAt: r.created_at,
    statusUpdatedAt: r.status_updated_at,
    consent: { given: r.consent_data_processing, at: r.consented_at },
    reviewedBy: r.reviewer_id !== null ? { id: r.reviewer_id, fullName: r.reviewer_name ?? "" } : null,
    offer: { id: r.offer_id, slug: r.offer_slug, title: r.offer_title, status: r.offer_status },
    files: {
      cv: { present: r.has_cv, sizeBytes: r.has_cv ? r.cv_size_bytes : null },
      coverLetter: { present: r.has_cover_letter },
    },
  };
}

/**
 * USAGE INTERNE (route de téléchargement) : clé de stockage, nom de téléchargement et taille, ou null.
 * Ne jamais renvoyer ce résultat tel quel au client.
 */
export async function getApplicationFile(id: number, kind: ApplicationFileKind): Promise<ApplicationFile | null> {
  const { rows } = await query<{ storage_key: string | null; original_name: string | null; size_bytes: number | null }>(
    kind === "cv"
      ? `SELECT cv_storage_key AS storage_key, cv_original_name AS original_name, cv_size_bytes AS size_bytes
         FROM application WHERE id = $1`
      : `SELECT cover_letter_storage_key AS storage_key, cover_letter_original_name AS original_name,
                NULL::int AS size_bytes
         FROM application WHERE id = $1`,
    [id]
  );

  const r = rows[0];
  if (!r || !r.storage_key) return null;
  return {
    storageKey: r.storage_key,
    downloadName: r.original_name || (kind === "cv" ? "cv.pdf" : "lettre-de-motivation.pdf"),
    sizeBytes: r.size_bytes,
  };
}

/**
 * Change le statut d'une candidature, en UNE transaction :
 * verrouille la ligne, lit l'ancien statut, refuse un statut identique (SAME_STATUS) ou une transition
 * interdite par ALLOWED_STATUS_TRANSITIONS (TRANSITION_NOT_ALLOWED), met à jour
 * (status, status_updated_at, reviewed_by) puis écrit l'audit UPDATE_APPLICATION_STATUS
 * avec metadata { from, to } (statuts uniquement, aucune donnée personnelle).
 * Un refus n'écrit aucun audit. Si l'audit échoue, la mise à jour est annulée avec la transaction.
 * Renvoie null si la candidature n'existe pas.
 */
export async function updateApplicationStatus(
  id: number,
  newStatus: ApplicationStatus,
  adminId: number
): Promise<StatusUpdateResult | null> {
  return withTransaction(async (client) => {
    const current = await client.query<{ status: ApplicationStatus }>(
      `SELECT status FROM application WHERE id = $1 FOR UPDATE`,
      [id]
    );
    const row = current.rows[0];
    if (!row) return null;

    if (row.status === newStatus) {
      return { updated: false, reason: "SAME_STATUS", current: row.status };
    }
    if (!isStatusTransitionAllowed(row.status, newStatus)) {
      return { updated: false, reason: "TRANSITION_NOT_ALLOWED", current: row.status };
    }

    await client.query(
      `UPDATE application
       SET status = $2, status_updated_at = now(), reviewed_by = $3
       WHERE id = $1`,
      [id, newStatus, adminId]
    );
    await logAdminAction(adminId, "UPDATE_APPLICATION_STATUS", "application", id, {
      client,
      metadata: { from: row.status, to: newStatus },
    });

    return { updated: true, from: row.status, to: newStatus };
  });
}
