// lib/api/admin-offer-status.ts
// Code commun aux actions de statut des offres (BE-09) :
//   POST /api/admin/job-offers/[id]/publish · /deactivate · /archive
// Ordre :
//   a) `await connection()` ; b) requireAdmin() → 401 ; c) Origin étranger → 403 ;
//   d) id → 400 ; aucun paramètre de query → 400 ;
//   e) corps obligatoirement vide (annoncé ou réel) → sinon 400 « Aucun corps attendu. » ;
//   f) changeJobOfferStatus : null → 404 ; TRANSITION_NOT_ALLOWED / CLOSING_DATE_PASSED → 409 ;
//      succès → 200 { data: { id, from, to } } (audit PUBLISH_OFFER / DEACTIVATE_OFFER / ARCHIVE_OFFER { from, to }).
// Une offre ARCHIVEE n'accepte aucune action : changeJobOfferStatus renvoie TRANSITION_NOT_ALLOWED
// avec allowedActions vide (409).
// Toutes les réponses : Cache-Control: private, no-store.

import "server-only";
import { connection, type NextRequest } from "next/server";
import {
  adminInvalidParams,
  adminJson,
  adminServerError,
  noQueryParamsSchema,
  withAdminCacheHeader,
} from "@/lib/api/admin-route";
import { isDeclaredBodyTooLarge, isOriginAllowed, readBodyWithLimit } from "@/lib/api/request-guards";
import { requireAdmin } from "@/lib/auth/require-admin";
import { changeJobOfferStatus } from "@/lib/db/adminJobOffers";
import { idParamSchema, type OfferAction } from "@/lib/validations/adminJobOffers";

/** Le corps doit être vide : Content-Length absent ou 0, et aucun octet réellement envoyé. */
async function hasEmptyBody(request: Request): Promise<boolean> {
  if (isDeclaredBodyTooLarge(request, 0)) return false;
  return (await readBodyWithLimit(request, 0)) !== null;
}

export function createOfferStatusActionHandler(action: OfferAction) {
  const label = `api/admin/job-offers/[id]/${action}`;

  return async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }): Promise<Response> {
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

      // d) Identifiant, puis query vide
      const parsedId = idParamSchema.safeParse(await context.params);
      if (!parsedId.success) return adminInvalidParams(parsedId.error);
      const parsedQuery = noQueryParamsSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
      if (!parsedQuery.success) return adminInvalidParams(parsedQuery.error);
      const id = parsedId.data.id;

      // e) Aucun corps attendu
      if (!(await hasEmptyBody(request))) {
        return adminJson(400, { error: "Aucun corps attendu." });
      }

      // f) Changement de statut + audit (transaction et règles dans lib/db/adminJobOffers.ts)
      const result = await changeJobOfferStatus(id, action, auth.admin.id);
      if (result === null) return adminJson(404, { error: "Offre introuvable." });

      if (!result.updated) {
        if (result.reason === "CLOSING_DATE_PASSED") {
          return adminJson(409, { error: "La date de clôture est passée : modifiez-la avant de publier." });
        }
        return adminJson(409, {
          error: "Changement de statut non autorisé.",
          current: result.current,
          allowedActions: result.allowedActions,
        });
      }

      return adminJson(200, { data: { id, from: result.from, to: result.to } });
    } catch (error) {
      return adminServerError(label, error);
    }
  };
}
