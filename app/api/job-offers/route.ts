// app/api/job-offers/route.ts
// GET /api/job-offers — liste PUBLIQUE des offres ouvertes (RG14 : openOfferCondition), sans authentification.
// Triées par date de publication décroissante. Champs publics uniquement (PublicJobOffer, lib/db/jobOffers.ts).
// Ordre : connection → limitation de débit « publicRead » (429) → aucun paramètre de query (400) → 200 { data }.
// Cache-Control: public, max-age=60 sur le 200 ; no-store sur les erreurs. Autres méthodes : 405 (Allow: GET).
// L'identifiant renvoyé (id) est celui attendu par POST /api/applications (champ job_offer_id).

import { createPublicGetHandler, publicMethodNotAllowed } from "@/lib/api/public-read";
import { listOpenJobOffers, toPublicJobOffer } from "@/lib/db/jobOffers";

export const GET = createPublicGetHandler({
  label: "api/job-offers",
  notFoundError: "Offre introuvable.",
  load: async () => (await listOpenJobOffers()).map(toPublicJobOffer),
});

export const POST = publicMethodNotAllowed;
export const PUT = publicMethodNotAllowed;
export const PATCH = publicMethodNotAllowed;
export const DELETE = publicMethodNotAllowed;
