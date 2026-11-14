// app/api/job-offers/[slug]/route.ts
// GET /api/job-offers/:slug — détail PUBLIC d'une offre ouverte, sans authentification.
// Ordre : connection → limitation de débit « publicRead » (429) → aucun paramètre de query (400)
//         → slug au mauvais format : 404 sans requête SQL → offre introuvable OU non ouverte
//         (brouillon, désactivée, archivée, expirée) : MÊME 404, sans indiquer pourquoi → 200 { data }.
// Champs publics uniquement (PublicJobOffer, lib/db/jobOffers.ts).
// Cache-Control: public, max-age=60 sur le 200 ; no-store sur les erreurs. Autres méthodes : 405 (Allow: GET).

import { createPublicGetHandler, publicMethodNotAllowed } from "@/lib/api/public-read";
import { getOpenJobOfferBySlug, toPublicJobOffer } from "@/lib/db/jobOffers";
import { isValidSlug } from "@/lib/slug";

export const GET = createPublicGetHandler<{ slug: string }>({
  label: "api/job-offers/[slug]",
  notFoundError: "Offre introuvable.",
  load: async ({ slug }) => {
    // Format de lib/slug.ts (même règle que la migration 010) : sinon 404 sans interroger la base.
    if (!isValidSlug(slug)) return null;
    const offer = await getOpenJobOfferBySlug(slug);
    return offer ? toPublicJobOffer(offer) : null;
  },
});

export const POST = publicMethodNotAllowed;
export const PUT = publicMethodNotAllowed;
export const PATCH = publicMethodNotAllowed;
export const DELETE = publicMethodNotAllowed;
