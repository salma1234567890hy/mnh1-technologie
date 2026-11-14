// lib/db/adminJobOffers.ts
// Accès aux données : gestion des offres d'emploi côté Admin (BE-09).
// Rôle mnh_app : SELECT / INSERT sur job_offer ; UPDATE sur tout sauf id, created_by, created_at ; aucun DELETE.
// Chaque écriture se fait dans UNE transaction avec son audit (CREATE_OFFER, UPDATE_OFFER, PUBLISH_OFFER,
// DEACTIVATE_OFFER, ARCHIVE_OFFER). Aucune suppression définitive.
// Règles de gestion : JOB_OFFER_RULES (lib/validations/adminJobOffers.ts) — à valider avec l'encadrant.
// Requêtes SQL paramétrées uniquement : les valeurs reçues ne sont jamais concaténées. Seuls des fragments
// constants du code (noms de colonnes d'une liste fermée, tri, condition RG14) sont insérés dans le SQL.

import "server-only";
import type { PoolClient } from "pg";
import { query, withTransaction } from "@/lib/db";
import { logAdminAction } from "@/lib/db/admin";
import { escapeLikePattern } from "@/lib/db/adminApplications";
import { openOfferCondition } from "@/lib/db/jobOffers";
import { slugify, withSlugSuffix } from "@/lib/slug";
import {
  JOB_OFFER_RULES,
  getAllowedOfferActions,
  getOfferTransition,
  type ContractType,
  type CreateOfferInput,
  type EditableOfferField,
  type ListOffersQuery,
  type OfferAction,
  type OfferSort,
  type OfferStatus,
  type UpdateOfferInput,
} from "@/lib/validations/adminJobOffers";

// ---------------------------------------------------------------- Types

export type JobOfferListItem = {
  id: number;
  slug: string;
  title: string;
  contractType: ContractType;
  location: string;
  status: OfferStatus;
  publishedAt: Date | null;
  /** AAAA-MM-JJ (texte, sans décalage de fuseau), ou null. */
  closingDate: string | null;
  createdAt: Date;
  updatedAt: Date;
  applicationCount: number;
  isOpen: boolean;
};

export type JobOfferList = {
  items: JobOfferListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type JobOfferDetail = JobOfferListItem & {
  description: string;
  missions: string[];
  requiredSkills: string[];
  createdBy: { id: number; fullName: string };
};

export type CreateOfferResult = { id: number; slug: string };

export type UpdateOfferResult =
  | { updated: true; id: number; fields: EditableOfferField[]; slug: string; slugChanged: boolean }
  | { updated: false; reason: "OFFER_ARCHIVED"; current: OfferStatus }
  | { updated: false; reason: "NO_CHANGES" }
  | { updated: false; reason: "LOCKED_FIELDS"; lockedFields: EditableOfferField[]; applicationCount: number };

export type ChangeStatusResult =
  | { updated: true; id: number; from: OfferStatus; to: OfferStatus; publishedAt: Date | null }
  | { updated: false; reason: "TRANSITION_NOT_ALLOWED"; current: OfferStatus; allowedActions: OfferAction[] }
  | { updated: false; reason: "CLOSING_DATE_PASSED"; current: OfferStatus; closingDate: string };

// ---------------------------------------------------------------- Constantes

/** Colonnes SQL des champs modifiables (liste FERMÉE) et codes d'audit correspondants. */
const FIELD_COLUMNS: Record<EditableOfferField, string> = {
  title: "title",
  description: "description",
  missions: "missions",
  requiredSkills: "required_skills",
  contractType: "contract_type",
  location: "location",
  closingDate: "closing_date",
};

const FIELD_AUDIT_CODES: Record<EditableOfferField, string> = {
  title: "TITLE",
  description: "DESCRIPTION",
  missions: "MISSIONS",
  requiredSkills: "REQUIRED_SKILLS",
  contractType: "CONTRACT_TYPE",
  location: "LOCATION",
  closingDate: "CLOSING_DATE",
};

const STATUS_AUDIT_ACTIONS = {
  publish: "PUBLISH_OFFER",
  deactivate: "DEACTIVATE_OFFER",
  archive: "ARCHIVE_OFFER",
} as const satisfies Record<OfferAction, string>;

const ORDER_BY: Record<OfferSort, string> = {
  recent: "jo.created_at DESC, jo.id DESC",
  oldest: "jo.created_at ASC, jo.id ASC",
};

/** Suffixes essayés pour rendre un slug unique (-2 … -100), puis nombre de tentatives en cas de course. */
const MAX_SLUG_SUFFIX = 100;
const MAX_SLUG_ATTEMPTS = 5;

/** Colonnes communes à la liste et au détail (closing_date en texte : aucun décalage de fuseau). */
const OFFER_COLUMNS = `
  jo.id, jo.slug, jo.title, jo.contract_type, jo.location, jo.status, jo.published_at,
  jo.closing_date::text AS closing_date, jo.created_at, jo.updated_at,
  (SELECT count(*)::int FROM application a WHERE a.job_offer_id = jo.id) AS application_count,
  (${openOfferCondition("jo")}) AS is_open`;

type OfferRow = {
  id: number;
  slug: string;
  title: string;
  contract_type: ContractType;
  location: string;
  status: OfferStatus;
  published_at: Date | null;
  closing_date: string | null;
  created_at: Date;
  updated_at: Date;
  application_count: number;
  is_open: boolean;
};

function toListItem(r: OfferRow): JobOfferListItem {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    contractType: r.contract_type,
    location: r.location,
    status: r.status,
    publishedAt: r.published_at,
    closingDate: r.closing_date,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    applicationCount: r.application_count,
    isOpen: r.is_open,
  };
}

// ---------------------------------------------------------------- Slug unique

function isSlugConflict(error: unknown): boolean {
  const e = error as { code?: string; constraint?: string };
  return e?.code === "23505" && e?.constraint === "job_offer_slug_key";
}

/** Premier slug libre parmi base, base-2 … base-100 (en excluant éventuellement l'offre elle-même). */
async function findAvailableSlug(client: PoolClient, base: string, excludeId: number | null): Promise<string> {
  const candidates = Array.from({ length: MAX_SLUG_SUFFIX }, (_, i) => withSlugSuffix(base, i + 1));
  const { rows } = await client.query<{ slug: string }>(
    `SELECT slug FROM job_offer WHERE slug = ANY($1::text[]) AND ($2::int IS NULL OR id <> $2::int)`,
    [candidates, excludeId]
  );
  const taken = new Set(rows.map((r) => r.slug));
  const free = candidates.find((c) => !taken.has(c));
  if (!free) throw new Error("Impossible de générer un slug unique pour cette offre");
  return free;
}

/**
 * Exécute une écriture qui pose un slug, avec un nombre LIMITÉ de tentatives :
 * si une autre transaction prend le même slug entre la recherche et l'écriture (violation UNIQUE),
 * l'écriture est annulée jusqu'au SAVEPOINT et retentée avec un nouveau slug.
 */
async function writeWithUniqueSlug<T>(
  client: PoolClient,
  base: string,
  excludeId: number | null,
  write: (slug: string) => Promise<T>
): Promise<T> {
  for (let attempt = 1; attempt <= MAX_SLUG_ATTEMPTS; attempt++) {
    const slug = await findAvailableSlug(client, base, excludeId);
    await client.query("SAVEPOINT offer_slug");
    try {
      const result = await write(slug);
      await client.query("RELEASE SAVEPOINT offer_slug");
      return result;
    } catch (error) {
      await client.query("ROLLBACK TO SAVEPOINT offer_slug");
      if (!isSlugConflict(error)) throw error;
    }
  }
  throw new Error("Impossible de générer un slug unique pour cette offre");
}

// ---------------------------------------------------------------- Lecture

/** Liste paginée et filtrée des offres (tous statuts), avec le nombre de candidatures. */
export async function listJobOffers(filters: ListOffersQuery): Promise<JobOfferList> {
  const pattern = filters.q ? `%${escapeLikePattern(filters.q)}%` : null;
  const where = `
    ($1::text IS NULL OR jo.status = $1::text)
    AND ($2::text IS NULL OR jo.title ILIKE $2::text ESCAPE '\\' OR jo.location ILIKE $2::text ESCAPE '\\'
         OR jo.slug ILIKE $2::text ESCAPE '\\')`;
  const params = [filters.status ?? null, pattern];

  const [count, rows] = await Promise.all([
    query<{ total: number }>(`SELECT count(*)::int AS total FROM job_offer jo WHERE ${where}`, params),
    query<OfferRow>(
      `SELECT ${OFFER_COLUMNS}
       FROM job_offer jo
       WHERE ${where}
       ORDER BY ${ORDER_BY[filters.sort] ?? ORDER_BY.recent}
       LIMIT $3 OFFSET $4`,
      [...params, filters.pageSize, (filters.page - 1) * filters.pageSize]
    ),
  ]);

  const total = count.rows[0].total;
  return {
    items: rows.rows.map(toListItem),
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.ceil(total / filters.pageSize),
  };
}

/** Détail d'une offre (tous statuts), avec nombre de candidatures et indicateur « ouverte au public ». */
export async function getJobOfferById(id: number): Promise<JobOfferDetail | null> {
  const { rows } = await query<OfferRow & { description: string; missions: string[]; required_skills: string[]; created_by: number; creator_name: string }>(
    `SELECT ${OFFER_COLUMNS}, jo.description, jo.missions, jo.required_skills,
            jo.created_by, u.full_name AS creator_name
     FROM job_offer jo
     JOIN admin_user u ON u.id = jo.created_by
     WHERE jo.id = $1`,
    [id]
  );
  const r = rows[0];
  if (!r) return null;
  return {
    ...toListItem(r),
    description: r.description,
    missions: r.missions,
    requiredSkills: r.required_skills,
    createdBy: { id: r.created_by, fullName: r.creator_name },
  };
}

// ---------------------------------------------------------------- Écriture

/** Crée une offre en BROUILLON, avec un slug unique généré à partir du titre ; audit CREATE_OFFER. */
export async function createJobOffer(data: CreateOfferInput, adminId: number): Promise<CreateOfferResult> {
  return withTransaction(async (client) => {
    const created = await writeWithUniqueSlug(client, slugify(data.title), null, async (slug) => {
      const { rows } = await client.query<{ id: number; slug: string }>(
        `INSERT INTO job_offer
           (slug, title, description, missions, required_skills, contract_type, location, closing_date, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'BROUILLON', $9)
         RETURNING id, slug`,
        [slug, data.title, data.description, data.missions, data.requiredSkills, data.contractType, data.location, data.closingDate, adminId]
      );
      return rows[0];
    });

    await logAdminAction(adminId, "CREATE_OFFER", "job_offer", created.id, { client, metadata: { status: "BROUILLON" } });
    return created;
  });
}

/** Valeur actuelle d'un champ, au format de l'entrée (pour détecter ce qui change vraiment). */
function currentValue(row: Record<string, unknown>, field: EditableOfferField): unknown {
  return row[FIELD_COLUMNS[field]];
}

/**
 * Modifie une offre, en UNE transaction : verrouille la ligne, ne garde que les champs qui changent vraiment,
 * applique les règles (offre archivée en lecture seule ; champs verrouillés si l'offre a déjà été publiée et
 * a des candidatures), régénère le slug si le titre change avant toute publication, puis écrit l'audit
 * UPDATE_OFFER avec metadata { fields: [CODES] } (jamais les valeurs). Renvoie null si l'offre n'existe pas.
 */
export async function updateJobOffer(id: number, data: UpdateOfferInput, adminId: number): Promise<UpdateOfferResult | null> {
  return withTransaction(async (client) => {
    const { rows } = await client.query<Record<string, unknown> & { status: OfferStatus; published_at: Date | null; slug: string }>(
      `SELECT status, published_at, slug, title, description, missions, required_skills, contract_type, location,
              closing_date::text AS closing_date
       FROM job_offer WHERE id = $1 FOR UPDATE`,
      [id]
    );
    const row = rows[0];
    if (!row) return null;

    if (JOB_OFFER_RULES.archivedIsReadOnly && row.status === "ARCHIVEE") {
      return { updated: false, reason: "OFFER_ARCHIVED", current: row.status };
    }

    // Champs réellement modifiés (comparaison des valeurs, tableaux compris).
    const changed = (Object.keys(FIELD_COLUMNS) as EditableOfferField[]).filter((field) => {
      const next = data[field];
      return next !== undefined && JSON.stringify(next) !== JSON.stringify(currentValue(row, field));
    });
    if (changed.length === 0) return { updated: false, reason: "NO_CHANGES" };

    // Offre déjà publiée au moins une fois et ayant des candidatures : champs verrouillés.
    if (row.published_at !== null) {
      const locked = changed.filter((f) => JOB_OFFER_RULES.lockedFieldsWhenPublishedWithApplications.includes(f));
      if (locked.length > 0) {
        const count = await client.query<{ n: number }>(
          `SELECT count(*)::int AS n FROM application WHERE job_offer_id = $1`,
          [id]
        );
        if (count.rows[0].n > 0) {
          return { updated: false, reason: "LOCKED_FIELDS", lockedFields: locked, applicationCount: count.rows[0].n };
        }
      }
    }

    // UPDATE construit à partir de la liste FERMÉE de colonnes ; toutes les valeurs sont paramétrées.
    const values = changed.map((f) => data[f]);
    const sets = changed.map((f, i) => `${FIELD_COLUMNS[f]} = $${i + 2}`);
    const regenerateSlug =
      JOB_OFFER_RULES.regenerateSlugOnTitleChangeBeforeFirstPublication && changed.includes("title") && row.published_at === null;

    const runUpdate = async (slug: string | null) => {
      const slugSet = slug ? `, slug = $${values.length + 2}` : "";
      const result = await client.query<{ slug: string }>(
        `UPDATE job_offer SET ${sets.join(", ")}${slugSet}, updated_at = now() WHERE id = $1 RETURNING slug`,
        slug ? [id, ...values, slug] : [id, ...values]
      );
      return result.rows[0].slug;
    };

    const newSlug = regenerateSlug
      ? await writeWithUniqueSlug(client, slugify(data.title as string), id, runUpdate)
      : await runUpdate(null);
    const slugChanged = newSlug !== row.slug;

    const fields = changed.map((f) => FIELD_AUDIT_CODES[f]);
    if (slugChanged) fields.push("SLUG");
    await logAdminAction(adminId, "UPDATE_OFFER", "job_offer", id, { client, metadata: { fields } });

    return { updated: true, id, fields: changed, slug: newSlug, slugChanged };
  });
}

/**
 * Change le statut d'une offre (publish / deactivate / archive), en UNE transaction : verrouille la ligne,
 * applique les règles de transition, refuse la publication si la date de clôture est passée (heure du Maroc),
 * renseigne published_at à la première publication, puis écrit l'audit (PUBLISH_OFFER / DEACTIVATE_OFFER /
 * ARCHIVE_OFFER) avec metadata { from, to }. Un refus n'écrit aucun audit. Renvoie null si l'offre n'existe pas.
 */
export async function changeJobOfferStatus(id: number, action: OfferAction, adminId: number): Promise<ChangeStatusResult | null> {
  return withTransaction(async (client) => {
    const { rows } = await client.query<{ status: OfferStatus; closing_date: string | null; closing_passed: boolean }>(
      `SELECT status, closing_date::text AS closing_date,
              (closing_date IS NOT NULL AND closing_date < (now() AT TIME ZONE 'Africa/Casablanca')::date) AS closing_passed
       FROM job_offer WHERE id = $1 FOR UPDATE`,
      [id]
    );
    const row = rows[0];
    if (!row) return null;

    const to = getOfferTransition(action, row.status);
    if (!to) {
      return { updated: false, reason: "TRANSITION_NOT_ALLOWED", current: row.status, allowedActions: getAllowedOfferActions(row.status) };
    }
    if (action === "publish" && JOB_OFFER_RULES.refusePublishIfClosingDatePassed && row.closing_passed) {
      return { updated: false, reason: "CLOSING_DATE_PASSED", current: row.status, closingDate: row.closing_date as string };
    }

    const publishedAtSql =
      action === "publish"
        ? JOB_OFFER_RULES.keepFirstPublicationDate
          ? "COALESCE(published_at, now())"
          : "now()"
        : "published_at";
    const updated = await client.query<{ published_at: Date | null }>(
      `UPDATE job_offer SET status = $2, published_at = ${publishedAtSql}, updated_at = now()
       WHERE id = $1 RETURNING published_at`,
      [id, to]
    );

    await logAdminAction(adminId, STATUS_AUDIT_ACTIONS[action], "job_offer", id, {
      client,
      metadata: { from: row.status, to },
    });

    return { updated: true, id, from: row.status, to, publishedAt: updated.rows[0].published_at };
  });
}
