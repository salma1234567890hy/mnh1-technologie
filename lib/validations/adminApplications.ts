// lib/validations/adminApplications.ts
// Schémas de validation de la gestion des candidatures côté Admin (BE-08).
// Les paramètres de query et de route arrivent en texte : les nombres sont convertis avec z.coerce.
// Utilisation : schema.safeParse(Object.fromEntries(request.nextUrl.searchParams))

import { z } from "zod";

/** Statuts exacts de la contrainte application_status_chk (db/migrations/003_recruitment.sql). */
export const APPLICATION_STATUSES = ["EN_ATTENTE", "EN_COURS_EXAMEN", "ACCEPTEE", "REFUSEE"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/**
 * Transitions de statut autorisées (version STRICTE) — À valider avec l'encadrant.
 *  - pas de retour vers EN_ATTENTE ;
 *  - ACCEPTEE et REFUSEE sont des statuts finaux (aucune sortie).
 * Source unique : utilisée par updateApplicationStatus (lib/db/adminApplications.ts),
 * réutilisable par l'interface Admin pour n'afficher que les choix possibles.
 */
export const ALLOWED_STATUS_TRANSITIONS: Readonly<Record<ApplicationStatus, readonly ApplicationStatus[]>> = {
  EN_ATTENTE: ["EN_COURS_EXAMEN", "ACCEPTEE", "REFUSEE"],
  EN_COURS_EXAMEN: ["ACCEPTEE", "REFUSEE"],
  ACCEPTEE: [],
  REFUSEE: [],
};

/** La transition from → to est-elle autorisée ? (un statut identique ne l'est jamais) */
export function isStatusTransitionAllowed(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return ALLOWED_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export const APPLICATION_SORTS = ["recent", "oldest"] as const;
export type ApplicationSort = (typeof APPLICATION_SORTS)[number];

export const ADMIN_APPLICATION_MESSAGES = {
  status: "Statut invalide : valeurs acceptées EN_ATTENTE, EN_COURS_EXAMEN, ACCEPTEE ou REFUSEE.",
  offerId: "Identifiant d'offre invalide.",
  q: "La recherche doit comporter 1 à 100 caractères.",
  page: "Le numéro de page doit être un nombre entier positif.",
  pageSize: "La taille de page doit être un nombre entier entre 1 et 100.",
  sort: "Tri invalide : valeurs acceptées recent ou oldest.",
  id: "Identifiant de candidature invalide.",
} as const;

/** Plafond d'un integer PostgreSQL. */
const MAX_INT = 2_147_483_647;

/** Erreurs au niveau de l'objet : paramètre inconnu, ou données qui ne sont pas un objet. */
const objectLevelError = {
  error: (issue: { code?: string }) =>
    issue.code === "unrecognized_keys" ? "Paramètre non autorisé." : "Paramètres invalides.",
};

const statusSchema = z.enum(APPLICATION_STATUSES, { error: ADMIN_APPLICATION_MESSAGES.status });

/** Liste paginée : ?status=…&offerId=…&q=…&page=…&pageSize=…&sort=recent|oldest */
export const listQuerySchema = z.strictObject(
  {
    status: statusSchema.optional(),
    offerId: z.coerce
      .number({ error: ADMIN_APPLICATION_MESSAGES.offerId })
      .int({ error: ADMIN_APPLICATION_MESSAGES.offerId })
      .positive({ error: ADMIN_APPLICATION_MESSAGES.offerId })
      .max(MAX_INT, { error: ADMIN_APPLICATION_MESSAGES.offerId })
      .optional(),
    q: z
      .string({ error: ADMIN_APPLICATION_MESSAGES.q })
      .trim()
      .min(1, { error: ADMIN_APPLICATION_MESSAGES.q })
      .max(100, { error: ADMIN_APPLICATION_MESSAGES.q })
      .optional(),
    page: z.coerce
      .number({ error: ADMIN_APPLICATION_MESSAGES.page })
      .int({ error: ADMIN_APPLICATION_MESSAGES.page })
      .min(1, { error: ADMIN_APPLICATION_MESSAGES.page })
      .max(100_000, { error: ADMIN_APPLICATION_MESSAGES.page })
      .default(1),
    pageSize: z.coerce
      .number({ error: ADMIN_APPLICATION_MESSAGES.pageSize })
      .int({ error: ADMIN_APPLICATION_MESSAGES.pageSize })
      .min(1, { error: ADMIN_APPLICATION_MESSAGES.pageSize })
      .max(100, { error: ADMIN_APPLICATION_MESSAGES.pageSize })
      .default(20),
    sort: z.enum(APPLICATION_SORTS, { error: ADMIN_APPLICATION_MESSAGES.sort }).default("recent"),
  },
  objectLevelError
);

/** Paramètre de route [id]. */
export const idParamSchema = z.strictObject(
  {
    id: z.coerce
      .number({ error: ADMIN_APPLICATION_MESSAGES.id })
      .int({ error: ADMIN_APPLICATION_MESSAGES.id })
      .positive({ error: ADMIN_APPLICATION_MESSAGES.id })
      .max(MAX_INT, { error: ADMIN_APPLICATION_MESSAGES.id }),
  },
  objectLevelError
);

/**
 * Corps du changement de statut. Pas de champ « note » : la table application n'a pas de colonne pour cela.
 */
export const updateStatusSchema = z.strictObject({ status: statusSchema }, objectLevelError);

export type ListApplicationsQuery = z.infer<typeof listQuerySchema>;
export type IdParam = z.infer<typeof idParamSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
