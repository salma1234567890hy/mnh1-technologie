// lib/db/jobOffers.ts
// Accès aux données : offres d'emploi publiques (table job_offer).
// Seules les offres « ouvertes » sont renvoyées (RG14) : status = 'PUBLIEE'
// ET (closing_date IS NULL OR closing_date >= date du jour au Maroc).
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

/** Alias de table SQL autorisés pour job_offer (constantes du code, jamais une valeur reçue). */
export type JobOfferAlias = "jo";

/**
 * Condition RG14 (offre « ouverte »), source unique pour toutes les requêtes.
 * « Aujourd'hui » est la date du Maroc, écrite explicitement : elle ne dépend pas du fuseau de la base.
 * @param alias alias de job_offer dans la requête appelante (ex. "jo" → "jo.status"), ou aucun.
 *              Limité par le type à des constantes du code et revérifié ici : rien de l'utilisateur n'est inséré.
 */
export function openOfferCondition(alias?: JobOfferAlias): string {
  if (alias !== undefined && !/^[a-z_]+$/.test(alias)) {
    throw new Error("Alias SQL invalide");
  }
  const p = alias ? `${alias}.` : "";
  return `${p}status = 'PUBLIEE'
  AND (${p}closing_date IS NULL OR ${p}closing_date >= (now() AT TIME ZONE 'Africa/Casablanca')::date)`;
}

/** Condition RG14 sans alias, partagée par les requêtes publiques et par les statistiques du dashboard. */
export const OPEN_OFFER_CONDITION = openOfferCondition();

const SUMMARY_COLUMNS = `id, slug, title, contract_type, location, published_at,
  closing_date::text AS closing_date`;

const DETAIL_COLUMNS = `${SUMMARY_COLUMNS}, description, missions, required_skills, updated_at`;

/**
 * Offre telle qu'exposée par les routes PUBLIQUES (/api/job-offers et /api/job-offers/[slug]).
 * Liste des champs publics définie à CE SEUL endroit : jamais le statut interne, created_by,
 * les dates internes de création / modification, le nombre de candidatures ni aucune donnée Admin.
 */
export type PublicJobOffer = {
  id: number;
  slug: string;
  title: string;
  description: string;
  location: string;
  contractType: ContractType;
  missions: string[];
  requiredSkills: string[];
  publishedAt: Date;
  /** AAAA-MM-JJ (date de clôture, heure du Maroc), ou null si l'offre n'a pas de date limite. */
  closingDate: string | null;
};

/** Mise en forme publique : sélection EXPLICITE des champs (tout autre champ est écarté). */
export function toPublicJobOffer(offer: JobOfferDetail): PublicJobOffer {
  return {
    id: offer.id,
    slug: offer.slug,
    title: offer.title,
    description: offer.description,
    location: offer.location,
    contractType: offer.contract_type,
    missions: offer.missions,
    requiredSkills: offer.required_skills,
    publishedAt: offer.published_at,
    closingDate: offer.closing_date,
  };
}

/**
 * Offres ouvertes (RG14), de la plus récente à la plus ancienne (date de publication décroissante).
 * Colonnes du détail : la liste publique expose les mêmes champs que le détail (voir PublicJobOffer).
 */
export async function listOpenJobOffers(): Promise<JobOfferDetail[]> {
  const { rows } = await query<JobOfferDetail>(
    `SELECT ${DETAIL_COLUMNS}
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
