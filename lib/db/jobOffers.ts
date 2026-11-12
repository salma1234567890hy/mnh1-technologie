// lib/db/jobOffers.ts
// Accès aux données : offres d'emploi publiques (table job_offer).
// Seules les offres « ouvertes » sont renvoyées (RG14) : status = 'PUBLIEE'
// ET (closing_date IS NULL OR closing_date >= CURRENT_DATE).
// Les offres BROUILLON, DESACTIVEE, ARCHIVEE ou échues ne sortent jamais d'ici.
// Requêtes SQL paramétrées uniquement ($1, $2…) — aucune concaténation de valeurs.

import { query } from "@/lib/db";

export type ContractType = "STAGE" | "CDI" | "CDD" | "ALTERNANCE" | "FREELANCE";

/** Résumé d'une offre ouverte (liste publique). */
export type JobOfferSummary = {
  id: number;
  slug: string;
  title: string;
  contract_type: ContractType;
  location: string;
  published_at: Date;
  /** Date de clôture au format "AAAA-MM-JJ" (texte, pour éviter tout décalage de fuseau), ou null. */
  closing_date: string | null;
};

/** Détail public d'une offre ouverte — sans created_by ni statut interne. */
export type JobOfferDetail = JobOfferSummary & {
  description: string;
  missions: string[];
  required_skills: string[];
  updated_at: Date;
};

/** Condition RG14, partagée par toutes les requêtes publiques. */
const OPEN_OFFER_CONDITION = `status = 'PUBLIEE'
  AND (closing_date IS NULL OR closing_date >= CURRENT_DATE)`;

const SUMMARY_COLUMNS = `id, slug, title, contract_type, location, published_at,
  closing_date::text AS closing_date`;

const DETAIL_COLUMNS = `${SUMMARY_COLUMNS}, description, missions, required_skills, updated_at`;

/** Offres ouvertes, de la plus récente à la plus ancienne. */
export async function listOpenJobOffers(): Promise<JobOfferSummary[]> {
  const { rows } = await query<JobOfferSummary>(
    `SELECT ${SUMMARY_COLUMNS}
     FROM job_offer
     WHERE ${OPEN_OFFER_CONDITION}
     ORDER BY published_at DESC, id DESC`
  );
  return rows;
}

/** Une offre ouverte par son slug, ou null si elle n'existe pas ou n'est pas ouverte. */
export async function getOpenJobOfferBySlug(slug: string): Promise<JobOfferDetail | null> {
  if (typeof slug !== "string" || slug.length === 0 || slug.length > 200) return null;

  const { rows } = await query<JobOfferDetail>(
    `SELECT ${DETAIL_COLUMNS}
     FROM job_offer
     WHERE slug = $1 AND ${OPEN_OFFER_CONDITION}
     LIMIT 1`,
    [slug]
  );
  return rows[0] ?? null;
}

/** Une offre ouverte par son identifiant, ou null (sert à vérifier une candidature). */
export async function getOpenJobOfferById(id: number): Promise<JobOfferDetail | null> {
  // Identifiant hors de la plage d'un integer PostgreSQL : inutile d'interroger la base.
  if (!Number.isSafeInteger(id) || id < 1 || id > 2_147_483_647) return null;

  const { rows } = await query<JobOfferDetail>(
    `SELECT ${DETAIL_COLUMNS}
     FROM job_offer
     WHERE id = $1 AND ${OPEN_OFFER_CONDITION}
     LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}
