// app/api/admin/job-offers/[id]/route.ts
// GET   /api/admin/job-offers/:id — détail d'une offre (tous statuts), avec le nombre de candidatures
//       et l'indicateur isOpen (« ouverte au public », via openOfferCondition) (BE-09).
//       Ordre : connection → requireAdmin (401) → id (400) → query vide (400) → introuvable (404) → 200 { data }.
// PATCH /api/admin/job-offers/:id — modification d'une offre, audit UPDATE_OFFER { fields } (BE-09).
//       Ordre : connection → requireAdmin (401) → Origin (403) → id (400) → corps JSON 32 Ko (415 / 413 / 400)
//       → updateOfferSchema (400) → règles JOB_OFFER_RULES (404 / 409) → 200 { data: { id, slug, fields } }.
// Autres méthodes : 405 avec Allow: GET, PATCH. Toutes les réponses : Cache-Control: private, no-store.
// Logique commune : lib/api/admin-route.ts et lib/api/request-guards.ts.

import { connection } from "next/server";
import {
  adminInvalidBody,
  adminInvalidParams,
  adminJson,
  adminServerError,
  createAdminGetByParamsHandler,
  methodNotAllowedWith,
  noQueryParamsSchema,
  readAdminJsonBody,
  withAdminCacheHeader,
} from "@/lib/api/admin-route";
import { isOriginAllowed } from "@/lib/api/request-guards";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getJobOfferById, updateJobOffer } from "@/lib/db/adminJobOffers";
import { idParamSchema, updateOfferSchema } from "@/lib/validations/adminJobOffers";

const LABEL = "api/admin/job-offers/[id]";
const MAX_BODY_BYTES = 32_768;

/** Codes d'audit des champs (identiques à ceux du journal UPDATE_OFFER). */
const FIELD_CODES = {
  title: "TITLE",
  description: "DESCRIPTION",
  missions: "MISSIONS",
  requiredSkills: "REQUIRED_SKILLS",
  contractType: "CONTRACT_TYPE",
  location: "LOCATION",
  closingDate: "CLOSING_DATE",
} as const;

export const GET = createAdminGetByParamsHandler(
  {
    label: LABEL,
    paramsSchema: idParamSchema,
    querySchema: noQueryParamsSchema,
    notFoundError: "Offre introuvable.",
  },
  ({ params }) => getJobOfferById(params.id)
);

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  // a) Rendu à chaque requête, avant le try.
  await connection();

  try {
    // b) Authentification
    const auth = await requireAdmin();
    if ("response" in auth) return withAdminCacheHeader(auth.response);

    // c) Origine
    if (!isOriginAllowed(request)) {
      return adminJson(403, { error: "Origine non autorisée." });
    }

    // d) Identifiant
    const parsedId = idParamSchema.safeParse(await context.params);
    if (!parsedId.success) return adminInvalidParams(parsedId.error);
    const id = parsedId.data.id;

    // e) Corps JSON (Content-Type, taille plafonnée, JSON)
    const read = await readAdminJsonBody(request, MAX_BODY_BYTES);
    if (!read.ok) return read.response;

    // f) Validation (le slug, le statut et les dates de publication ne sont jamais acceptés)
    const parsed = updateOfferSchema.safeParse(read.body);
    if (!parsed.success) return adminInvalidBody(parsed.error);

    // g) Modification + audit (transaction et règles dans lib/db/adminJobOffers.ts)
    const result = await updateJobOffer(id, parsed.data, auth.admin.id);
    if (result === null) return adminJson(404, { error: "Offre introuvable." });

    if (!result.updated) {
      switch (result.reason) {
        case "OFFER_ARCHIVED":
          return adminJson(409, { error: "Une offre archivée ne peut plus être modifiée." });
        case "LOCKED_FIELDS":
          return adminJson(409, {
            error: "Certains champs ne sont plus modifiables car l'offre a déjà reçu des candidatures.",
            fields: result.lockedFields.map((f) => FIELD_CODES[f]),
          });
        case "NO_CHANGES":
          return adminJson(409, { error: "Aucune modification." });
      }
    }

    const fields: string[] = result.fields.map((f) => FIELD_CODES[f]);
    if (result.slugChanged) fields.push("SLUG");
    return adminJson(200, { data: { id, slug: result.slug, fields } });
  } catch (error) {
    return adminServerError(LABEL, error);
  }
}

const notAllowed = methodNotAllowedWith("GET, PATCH");
export const POST = notAllowed;
export const PUT = notAllowed;
export const DELETE = notAllowed;
