// lib/validations/adminJobOffers.ts
// Schémas de validation et règles de gestion des offres d'emploi côté Admin (BE-09).
// Les textes sont stockés en TEXTE BRUT : aucun rendu HTML côté serveur (l'affichage devra échapper le texte).
// Utilisation (query) : schema.safeParse(Object.fromEntries(request.nextUrl.searchParams))

import { z } from "zod";

/** Statuts exacts de la contrainte job_offer_status_chk (db/migrations/003_recruitment.sql). */
export const OFFER_STATUSES = ["BROUILLON", "PUBLIEE", "DESACTIVEE", "ARCHIVEE"] as const;
export type OfferStatus = (typeof OFFER_STATUSES)[number];

/** Types de contrat exacts de la contrainte job_offer_contract_type_chk. */
export const CONTRACT_TYPES = ["STAGE", "CDI", "CDD", "ALTERNANCE", "FREELANCE"] as const;
export type ContractType = (typeof CONTRACT_TYPES)[number];

export const OFFER_ACTIONS = ["publish", "deactivate", "archive"] as const;
export type OfferAction = (typeof OFFER_ACTIONS)[number];

export const OFFER_SORTS = ["recent", "oldest"] as const;
export type OfferSort = (typeof OFFER_SORTS)[number];

/** Champs modifiables par l'Admin (le slug, les dates de publication et le statut ne sont jamais envoyés). */
export const EDITABLE_OFFER_FIELDS = [
  "title",
  "description",
  "missions",
  "requiredSkills",
  "contractType",
  "location",
  "closingDate",
] as const;
export type EditableOfferField = (typeof EDITABLE_OFFER_FIELDS)[number];

// ---------------------------------------------------------------- Règles — À valider avec l'encadrant

/**
 * Règles de gestion des offres — À valider avec l'encadrant.
 * Source unique, utilisée par lib/db/adminJobOffers.ts ; modifiable sans toucher au reste du code.
 */
export const JOB_OFFER_RULES = {
  /**
   * Transitions de statut, par action : statuts de départ autorisés → statut d'arrivée.
   * ARCHIVEE est final (aucune action possible).
   */
  transitions: {
    publish: { from: ["BROUILLON", "DESACTIVEE"], to: "PUBLIEE" },
    deactivate: { from: ["PUBLIEE"], to: "DESACTIVEE" },
    archive: { from: ["BROUILLON", "PUBLIEE", "DESACTIVEE"], to: "ARCHIVEE" },
  } satisfies Record<OfferAction, { from: readonly OfferStatus[]; to: OfferStatus }>,

  /** La publication est refusée si la date de clôture est déjà passée (heure du Maroc). */
  refusePublishIfClosingDatePassed: true,

  /** published_at n'est renseigné qu'à la PREMIÈRE publication (une republication garde la date d'origine). */
  keepFirstPublicationDate: true,

  /**
   * Offre déjà publiée au moins une fois ET ayant des candidatures : ces champs sont verrouillés
   * (les candidats ont postulé à ces conditions). Les autres champs restent modifiables.
   */
  lockedFieldsWhenPublishedWithApplications: ["title", "contractType", "location"] as readonly EditableOfferField[],

  /** Une offre ARCHIVEE n'est plus modifiable. */
  archivedIsReadOnly: true,

  /** Slug régénéré si le titre change, TANT QUE l'offre n'a jamais été publiée ; figé ensuite (liens publics). */
  regenerateSlugOnTitleChangeBeforeFirstPublication: true,
} as const;

/** Statut d'arrivée de l'action depuis le statut actuel, ou null si la transition est interdite. */
export function getOfferTransition(action: OfferAction, from: OfferStatus): OfferStatus | null {
  const rule = JOB_OFFER_RULES.transitions[action];
  return (rule.from as readonly OfferStatus[]).includes(from) ? rule.to : null;
}

/** Actions possibles depuis un statut (pour l'interface et les messages d'erreur). */
export function getAllowedOfferActions(from: OfferStatus): OfferAction[] {
  return OFFER_ACTIONS.filter((action) => getOfferTransition(action, from) !== null);
}

// ---------------------------------------------------------------- Limites (cohérentes avec la migration 010 proposée)

export const OFFER_LIMITS = {
  title: { min: 3, max: 150 },
  description: { min: 20, max: 10_000 },
  location: { min: 2, max: 100 },
  missions: { maxItems: 20, itemMin: 2, itemMax: 300 },
  requiredSkills: { maxItems: 30, itemMin: 1, itemMax: 80 },
} as const;

export const ADMIN_OFFER_MESSAGES = {
  status: "Statut invalide : valeurs acceptées BROUILLON, PUBLIEE, DESACTIVEE ou ARCHIVEE.",
  q: "La recherche doit comporter 1 à 100 caractères.",
  page: "Le numéro de page doit être un nombre entier positif.",
  pageSize: "La taille de page doit être un nombre entier entre 1 et 100.",
  sort: "Tri invalide : valeurs acceptées recent ou oldest.",
  id: "Identifiant d'offre invalide.",
  title: `Le titre doit comporter ${OFFER_LIMITS.title.min} à ${OFFER_LIMITS.title.max} caractères.`,
  description: `La description doit comporter ${OFFER_LIMITS.description.min} à ${OFFER_LIMITS.description.max} caractères.`,
  location: `Le lieu doit comporter ${OFFER_LIMITS.location.min} à ${OFFER_LIMITS.location.max} caractères.`,
  missions: `Missions : ${OFFER_LIMITS.missions.maxItems} au maximum, de ${OFFER_LIMITS.missions.itemMin} à ${OFFER_LIMITS.missions.itemMax} caractères chacune.`,
  requiredSkills: `Compétences : ${OFFER_LIMITS.requiredSkills.maxItems} au maximum, de ${OFFER_LIMITS.requiredSkills.itemMin} à ${OFFER_LIMITS.requiredSkills.itemMax} caractères chacune.`,
  contractType: "Type de contrat invalide : valeurs acceptées STAGE, CDI, CDD, ALTERNANCE ou FREELANCE.",
  closingDate: "Date de clôture invalide (format AAAA-MM-JJ).",
  closingDatePast: "La date de clôture ne peut pas être dans le passé.",
  noField: "Aucun champ à modifier.",
} as const;

const MAX_INT = 2_147_483_647;

/** Date du jour au Maroc (AAAA-MM-JJ), cohérente avec openOfferCondition. */
export function todayInCasablanca(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Casablanca", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

const objectLevelError = {
  error: (issue: { code?: string }) =>
    issue.code === "unrecognized_keys" ? "Champ non autorisé." : "Données invalides.",
};

// ---------------------------------------------------------------- Schémas

/** Liste paginée : ?status=…&q=…&page=…&pageSize=…&sort=recent|oldest */
export const listQuerySchema = z.strictObject(
  {
    status: z.enum(OFFER_STATUSES, { error: ADMIN_OFFER_MESSAGES.status }).optional(),
    q: z
      .string({ error: ADMIN_OFFER_MESSAGES.q })
      .trim()
      .min(1, { error: ADMIN_OFFER_MESSAGES.q })
      .max(100, { error: ADMIN_OFFER_MESSAGES.q })
      .optional(),
    page: z.coerce
      .number({ error: ADMIN_OFFER_MESSAGES.page })
      .int({ error: ADMIN_OFFER_MESSAGES.page })
      .min(1, { error: ADMIN_OFFER_MESSAGES.page })
      .max(100_000, { error: ADMIN_OFFER_MESSAGES.page })
      .default(1),
    pageSize: z.coerce
      .number({ error: ADMIN_OFFER_MESSAGES.pageSize })
      .int({ error: ADMIN_OFFER_MESSAGES.pageSize })
      .min(1, { error: ADMIN_OFFER_MESSAGES.pageSize })
      .max(100, { error: ADMIN_OFFER_MESSAGES.pageSize })
      .default(20),
    sort: z.enum(OFFER_SORTS, { error: ADMIN_OFFER_MESSAGES.sort }).default("recent"),
  },
  { error: (issue) => (issue.code === "unrecognized_keys" ? "Paramètre non autorisé." : "Paramètres invalides.") }
);

/** Paramètre de route [id]. */
export const idParamSchema = z.strictObject(
  {
    id: z.coerce
      .number({ error: ADMIN_OFFER_MESSAGES.id })
      .int({ error: ADMIN_OFFER_MESSAGES.id })
      .positive({ error: ADMIN_OFFER_MESSAGES.id })
      .max(MAX_INT, { error: ADMIN_OFFER_MESSAGES.id }),
  },
  { error: (issue) => (issue.code === "unrecognized_keys" ? "Paramètre non autorisé." : "Paramètres invalides.") }
);

const text = (min: number, max: number, message: string) =>
  z.string({ error: message }).trim().min(min, { error: message }).max(max, { error: message });

const textList = (limits: { maxItems: number; itemMin: number; itemMax: number }, message: string) =>
  z.array(text(limits.itemMin, limits.itemMax, message), { error: message }).max(limits.maxItems, { error: message });

/** Date de clôture : AAAA-MM-JJ, pas dans le passé (heure du Maroc) ; null pour l'effacer. */
const closingDateSchema = z
  .iso.date({ error: ADMIN_OFFER_MESSAGES.closingDate })
  .refine((d) => d >= todayInCasablanca(), { error: ADMIN_OFFER_MESSAGES.closingDatePast })
  .nullable();

const offerFields = {
  title: text(OFFER_LIMITS.title.min, OFFER_LIMITS.title.max, ADMIN_OFFER_MESSAGES.title),
  description: text(OFFER_LIMITS.description.min, OFFER_LIMITS.description.max, ADMIN_OFFER_MESSAGES.description),
  missions: textList(OFFER_LIMITS.missions, ADMIN_OFFER_MESSAGES.missions),
  requiredSkills: textList(OFFER_LIMITS.requiredSkills, ADMIN_OFFER_MESSAGES.requiredSkills),
  contractType: z.enum(CONTRACT_TYPES, { error: ADMIN_OFFER_MESSAGES.contractType }),
  location: text(OFFER_LIMITS.location.min, OFFER_LIMITS.location.max, ADMIN_OFFER_MESSAGES.location),
  closingDate: closingDateSchema,
};

/**
 * Création d'une offre. Le slug n'est PAS envoyé : il est généré à partir du titre.
 * L'offre est créée en BROUILLON ; published_at est renseigné par l'action « publish ».
 */
export const createOfferSchema = z.strictObject(
  {
    ...offerFields,
    missions: offerFields.missions.default([]),
    requiredSkills: offerFields.requiredSkills.default([]),
    closingDate: offerFields.closingDate.optional().transform((v) => v ?? null),
  },
  objectLevelError
);

/** Modification : mêmes champs, tous facultatifs, au moins un. */
export const updateOfferSchema = z
  .strictObject(
    {
      title: offerFields.title.optional(),
      description: offerFields.description.optional(),
      missions: offerFields.missions.optional(),
      requiredSkills: offerFields.requiredSkills.optional(),
      contractType: offerFields.contractType.optional(),
      location: offerFields.location.optional(),
      closingDate: offerFields.closingDate.optional(),
    },
    objectLevelError
  )
  .refine((data) => Object.values(data).some((v) => v !== undefined), { error: ADMIN_OFFER_MESSAGES.noField });

export type ListOffersQuery = z.infer<typeof listQuerySchema>;
export type CreateOfferInput = z.infer<typeof createOfferSchema>;
export type UpdateOfferInput = z.infer<typeof updateOfferSchema>;
