// app/api/admin/job-offers/[id]/archive/route.ts
// POST /api/admin/job-offers/:id/archive — archiver une offre (BE-09), audit ARCHIVE_OFFER { from, to }.
// Corps vide obligatoire. Réponses : 200 { data: { id, from, to } } · 400 · 401 · 403 · 404 · 409 · 405 · 500.
// Règles de transition : JOB_OFFER_RULES (lib/validations/adminJobOffers.ts) — à valider avec l'encadrant.
// Toutes les réponses : Cache-Control: private, no-store. Logique commune : lib/api/admin-offer-status.ts.

import { createOfferStatusActionHandler } from "@/lib/api/admin-offer-status";
import { methodNotAllowedWith } from "@/lib/api/admin-route";

export const POST = createOfferStatusActionHandler("archive");

const notAllowed = methodNotAllowedWith("POST");
export const GET = notAllowed;
export const PUT = notAllowed;
export const PATCH = notAllowed;
export const DELETE = notAllowed;
