// lib/db/applications.ts
// Accès aux données : candidatures (table application).
// Requête SQL paramétrée uniquement ($1, $2…) — aucune concaténation de valeurs.

import { query } from "@/lib/db";
import { openOfferCondition } from "@/lib/db/jobOffers";
import type { ApplicationInput } from "@/lib/validations/application";

/** Condition RG14 (même source que les pages publiques), avec l'alias jo de la requête ci-dessous. */
const OPEN_OFFER_CONDITION_JO = openOfferCondition("jo");

/** Lettre de motivation : la clé et le nom d'origine sont fournis ensemble, ou pas du tout. */
type CoverLetterFields =
  | { cover_letter_storage_key: string; cover_letter_original_name: string }
  | { cover_letter_storage_key?: null; cover_letter_original_name?: null };

/** Candidature à enregistrer : champs texte validés (sans consent, toujours vrai) + fichiers déjà stockés. */
export type NewApplication = Omit<ApplicationInput, "consent"> & {
  cv_storage_key: string;
  cv_original_name: string;
  cv_size_bytes: number;
} & CoverLetterFields;

/**
 * Enregistre une candidature avec le statut par défaut EN_ATTENTE (RG16).
 * Une seule requête INSERT … SELECT : la candidature n'est créée que si l'offre est
 * encore ouverte AU MOMENT de l'insertion (RG14), même si elle a changé entre-temps.
 * Renvoie l'identifiant créé, ou null si l'offre n'existe pas ou n'est pas ouverte.
 */
export async function createApplication(input: NewApplication): Promise<number | null> {
  // Les paramètres de la liste SELECT sont typés explicitement : sans cela,
  // PostgreSQL les lirait comme du texte (refusé pour cv_size_bytes, integer).
  const { rows } = await query<{ id: number }>(
    `INSERT INTO application (
       job_offer_id, full_name, email, phone,
       cv_storage_key, cv_original_name, cv_size_bytes,
       cover_letter_storage_key, cover_letter_original_name,
       message, consent_data_processing
     )
     SELECT
       jo.id, $2::text, $3::text, $4::text,
       $5::text, $6::text, $7::integer,
       $8::text, $9::text,
       $10::text, true
     FROM job_offer jo
     WHERE jo.id = $1
       AND ${OPEN_OFFER_CONDITION_JO}
     RETURNING id`,
    [
      input.job_offer_id,
      input.full_name,
      input.email,
      input.phone,
      input.cv_storage_key,
      input.cv_original_name,
      input.cv_size_bytes,
      input.cover_letter_storage_key ?? null,
      input.cover_letter_original_name ?? null,
      input.message ?? null,
    ]
  );
  return rows[0]?.id ?? null;
}
