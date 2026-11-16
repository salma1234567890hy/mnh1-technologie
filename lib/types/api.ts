// lib/types/api.ts
// Types « tels qu'ils circulent en JSON » entre les routes /api et le navigateur.
// Partagés par le client (lib/client/*) et utilisables côté serveur.
//
// Règle : ce fichier n'importe des modules serveur QU'AVEC `import type` (effacé à la compilation :
// aucun code serveur, ni "server-only", n'arrive dans le bundle navigateur). Les types sont DÉRIVÉS
// des types du Backend : si une route change de champs, la compilation du client échoue.

import type { PublicJobOffer } from "@/lib/db/jobOffers";
import type { AdminIdentity } from "@/lib/db/admin";
import type { contactSchema } from "@/lib/validations/contact";
import type { z } from "zod";

/** Une Date sérialisée par Response.json() devient une chaîne ISO 8601. */
type Serialized<T> = { [K in keyof T]: T[K] extends Date ? string : T[K] extends Date | null ? string | null : T[K] };

/** Offre d'emploi publique (GET /api/job-offers, GET /api/job-offers/:slug). */
export type PublicJobOfferJson = Serialized<PublicJobOffer>;

export type ContractType = PublicJobOffer["contractType"];

/** Admin connecté (GET /api/admin/me). */
export type AdminMe = AdminIdentity;

/** Corps de POST /api/contact (`website` = champ piège, à laisser vide). */
export type ContactMessageInput = z.input<typeof contactSchema>;

/** Réponses de succès avec message (POST /api/contact, POST /api/applications). */
export type MessageResponse = { ok: true; message: string };

/** Erreurs de validation par champ (z.flattenError côté serveur). */
export type FieldErrors = Record<string, string[] | undefined>;
