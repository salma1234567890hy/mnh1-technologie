// app/api/admin/job-offers/route.ts
// GET  /api/admin/job-offers?status=…&q=…&page=…&pageSize=…&sort=recent|oldest — liste des offres (tous statuts).
// POST /api/admin/job-offers — création d'une offre en BROUILLON (slug généré), audit CREATE_OFFER (BE-09).
// Ordre du POST : connection → requireAdmin (401) → Origin (403) → Content-Type (415) → taille 32 Ko (413)
//                 → JSON (400) → createOfferSchema (400) → création → 201 { data } + Location.
// Autres méthodes : 405 avec Allow: GET, POST. Toutes les réponses : Cache-Control: private, no-store.
// Logique commune : lib/api/admin-route.ts et lib/api/request-guards.ts.

import { connection } from "next/server";
import {
  adminInvalidBody,
  adminJson,
  adminServerError,
  createAdminGetHandler,
  methodNotAllowedWith,
  readAdminJsonBody,
  withAdminCacheHeader,
} from "@/lib/api/admin-route";
import { isOriginAllowed } from "@/lib/api/request-guards";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createJobOffer, listJobOffers } from "@/lib/db/adminJobOffers";
import { createOfferSchema, listQuerySchema } from "@/lib/validations/adminJobOffers";

const LABEL = "api/admin/job-offers";
const MAX_BODY_BYTES = 32_768;

export const GET = createAdminGetHandler(LABEL, listQuerySchema, (filters) => listJobOffers(filters));

export async function POST(request: Request) {
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

    // d) e) f) Content-Type, taille plafonnée, JSON
    const read = await readAdminJsonBody(request, MAX_BODY_BYTES);
    if (!read.ok) return read.response;

    // g) Validation (le slug n'est jamais accepté : il est généré)
    const parsed = createOfferSchema.safeParse(read.body);
    if (!parsed.success) return adminInvalidBody(parsed.error);

    // h) Création + audit (transaction dans lib/db/adminJobOffers.ts)
    const created = await createJobOffer(parsed.data, auth.admin.id);
    return adminJson(201, { data: created }, { Location: `/api/admin/job-offers/${created.id}` });
  } catch (error) {
    return adminServerError(LABEL, error);
  }
}

const notAllowed = methodNotAllowedWith("GET, POST");
export const PUT = notAllowed;
export const PATCH = notAllowed;
export const DELETE = notAllowed;
