// lib/validations/dashboard.ts
// Schémas de validation des paramètres de query des routes /api/admin/dashboard/* (F08).
// Les valeurs arrivent en texte (URLSearchParams) : limit est converti avec z.coerce.
// Utilisation : schema.safeParse(Object.fromEntries(request.nextUrl.searchParams))

import { z } from "zod";

export const PERIODS = ["7d", "30d", "90d"] as const;
export type Period = (typeof PERIODS)[number];

/** Nombre de jours calendaires couverts par chaque période (aujourd'hui inclus). */
export const PERIOD_DAYS: Record<Period, number> = { "7d": 7, "30d": 30, "90d": 90 };

export const DASHBOARD_MESSAGES = {
  period: "Période invalide : valeurs acceptées 7d, 30d ou 90d.",
  limit: "La limite doit être un nombre entier entre 1 et 50.",
} as const;

/** Période : 7d, 30d ou 90d ; 30d par défaut. */
export const periodSchema = z.enum(PERIODS, { error: DASHBOARD_MESSAGES.period }).default("30d");

/** Erreurs au niveau de la query : paramètre inconnu ou données qui ne sont pas un objet. */
const queryLevelError = {
  error: (issue: { code?: string }) =>
    issue.code === "unrecognized_keys"
      ? "La requête contient des paramètres non autorisés."
      : "Paramètres de requête invalides.",
};

/** Query ?period=… (overview, séries, répartitions). */
export const periodQuerySchema = z.strictObject({ period: periodSchema }, queryLevelError);

/** Query ?period=…&limit=… (pages les plus vues). */
export const topPagesQuerySchema = z.strictObject(
  {
    period: periodSchema,
    limit: z.coerce
      .number({ error: DASHBOARD_MESSAGES.limit })
      .int({ error: DASHBOARD_MESSAGES.limit })
      .min(1, { error: DASHBOARD_MESSAGES.limit })
      .max(50, { error: DASHBOARD_MESSAGES.limit })
      .default(10),
  },
  queryLevelError
);

export type PeriodQuery = z.infer<typeof periodQuerySchema>;
export type TopPagesQuery = z.infer<typeof topPagesQuerySchema>;
