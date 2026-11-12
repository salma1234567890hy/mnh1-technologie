// lib/validations/application.ts
// Schéma de validation des champs TEXTE du formulaire de candidature (RG16).
// Les fichiers (CV, lettre de motivation) sont contrôlés à part par lib/storage (validatePdf).
// Les valeurs arrivent en texte depuis FormData : job_offer_id est converti avec z.coerce.
// Utilisé côté serveur par POST /api/applications, et réutilisable côté client (formulaire FE-07).

import { z } from "zod";

export const APPLICATION_MESSAGES = {
  job_offer_id: "Offre d'emploi invalide.",
  full_name: "Veuillez saisir votre nom (2 à 100 caractères).",
  email: "Adresse e-mail invalide.",
  phone: "Numéro de téléphone invalide (6 à 30 caractères : chiffres, espaces, +, -, parenthèses).",
  message: "Le message ne doit pas dépasser 2 000 caractères.",
  consent: "Vous devez accepter le traitement de vos données.",
} as const;

/** Chiffres, espaces, +, -, ( et ) uniquement. */
const PHONE_PATTERN = /^[0-9 +\-()]+$/;

export const applicationSchema = z.strictObject({
  job_offer_id: z.coerce
    .number({ error: APPLICATION_MESSAGES.job_offer_id })
    .int({ error: APPLICATION_MESSAGES.job_offer_id })
    .positive({ error: APPLICATION_MESSAGES.job_offer_id })
    // Plafond d'un integer PostgreSQL
    .max(2_147_483_647, { error: APPLICATION_MESSAGES.job_offer_id }),

  full_name: z
    .string({ error: APPLICATION_MESSAGES.full_name })
    .trim()
    .min(2, { error: APPLICATION_MESSAGES.full_name })
    .max(100, { error: APPLICATION_MESSAGES.full_name }),

  email: z
    .string({ error: APPLICATION_MESSAGES.email })
    .trim()
    .toLowerCase()
    .max(254, { error: APPLICATION_MESSAGES.email })
    .pipe(z.email({ error: APPLICATION_MESSAGES.email })),

  phone: z
    .string({ error: APPLICATION_MESSAGES.phone })
    .trim()
    .min(6, { error: APPLICATION_MESSAGES.phone })
    .max(30, { error: APPLICATION_MESSAGES.phone })
    .regex(PHONE_PATTERN, { error: APPLICATION_MESSAGES.phone }),

  // Facultatif : une chaîne vide (ou uniquement des espaces) est traitée comme absente.
  message: z
    .string({ error: APPLICATION_MESSAGES.message })
    .trim()
    .max(2000, { error: APPLICATION_MESSAGES.message })
    .optional()
    .transform((value) => (value ? value : undefined)),

  // Case à cocher : "on" (valeur HTML par défaut) ou "true". Toute autre valeur, ou l'absence, est refusée.
  consent: z
    .enum(["true", "on"], { error: APPLICATION_MESSAGES.consent })
    .transform(() => true as const),
}, {
  // Erreurs au niveau du formulaire : champ inconnu (ex. "status") ou données qui ne sont pas un objet.
  error: (issue) =>
    issue.code === "unrecognized_keys"
      ? "Le formulaire contient des champs non autorisés."
      : "Données du formulaire invalides.",
});

/** Données avant validation (telles que reçues). */
export type ApplicationFormInput = z.input<typeof applicationSchema>;

/** Données validées : job_offer_id en nombre, email en minuscules, message absent si vide, consent = true. */
export type ApplicationInput = z.infer<typeof applicationSchema>;
