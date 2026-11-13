// lib/validations/analytics.ts
// Schéma de validation du corps envoyé par le navigateur pour le suivi des visites (RG03 à RG08).
// Seuls les champs ayant une colonne correspondante sont acceptés (db/migrations/002_tracking.sql) :
//   - path     → page_view.path et visitor_session.entry_path (300 caractères maximum en base) ;
//   - referrer → visitor_session.referrer_host (seul le nom de domaine est conservé).
// Le type d'appareil et le navigateur sont déduits de l'en-tête User-Agent, pas du corps.
// Utilisé côté serveur par la future route POST de suivi (T2).

import { z } from "zod";

export const ANALYTICS_MESSAGES = {
  path: "Chemin de page invalide.",
  pathTooLong: "Le chemin de la page est trop long.",
  referrer: "Référent invalide.",
} as const;

/** Longueur maximale d'un chemin en base (contraintes page_view_path_chk et visitor_session_entry_path_chk). */
export const MAX_STORED_PATH_LENGTH = 300;

/**
 * Chemin relatif uniquement : commence par un seul "/" (jamais "//domaine", qui serait une URL complète),
 * sans espace ni caractère de contrôle.
 */
const RELATIVE_PATH_PATTERN = /^\/(?!\/)[^\s\u0000-\u001f\u007f]*$/;

/**
 * Supprime la query string et le fragment : ils peuvent contenir des données personnelles
 * (adresse e-mail, jeton…) et ne servent pas aux statistiques de pages.
 */
function stripQueryAndFragment(path: string): string {
  const end = path.search(/[?#]/);
  return end === -1 ? path : path.slice(0, end);
}

export const trackingSchema = z.strictObject(
  {
    path: z
      .string({ error: ANALYTICS_MESSAGES.path })
      .trim()
      .min(1, { error: ANALYTICS_MESSAGES.path })
      .max(2048, { error: ANALYTICS_MESSAGES.pathTooLong })
      .regex(RELATIVE_PATH_PATTERN, { error: ANALYTICS_MESSAGES.path })
      .transform(stripQueryAndFragment)
      .pipe(
        z
          .string()
          .min(1, { error: ANALYTICS_MESSAGES.path })
          .max(MAX_STORED_PATH_LENGTH, { error: ANALYTICS_MESSAGES.pathTooLong })
      ),

    // Facultatif : URL http(s) valide, ou chaîne vide (traitée comme absente).
    referrer: z
      .union(
        [
          z.literal(""),
          z
            .string()
            .trim()
            .max(2048, { error: ANALYTICS_MESSAGES.referrer })
            .pipe(z.url({ protocol: /^https?$/, error: ANALYTICS_MESSAGES.referrer })),
        ],
        { error: ANALYTICS_MESSAGES.referrer }
      )
      .optional()
      .transform((value) => (value ? value : undefined)),
  },
  {
    // Erreurs au niveau du corps : champ inconnu ou données qui ne sont pas un objet.
    error: (issue) =>
      issue.code === "unrecognized_keys"
        ? "La requête contient des champs non autorisés."
        : "Données de suivi invalides.",
  }
);

export type TrackingInput = z.infer<typeof trackingSchema>;
