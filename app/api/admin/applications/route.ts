// app/api/admin/applications/route.ts
// GET /api/admin/applications?status=…&offerId=…&q=…&page=…&pageSize=…&sort=recent|oldest
// Liste paginée et filtrée des candidatures (BE-08). Simple consultation : aucun audit.
// Réponses : 200 { data: { items, total, page, pageSize, totalPages } } · 400 paramètres invalides
// · 401 non autorisé · 405 méthode refusée · 500 erreur serveur.
// Toutes : Cache-Control: private, no-store. Logique commune : lib/api/admin-route.ts.

import { createAdminGetHandler, methodNotAllowed } from "@/lib/api/admin-route";
import { listApplications } from "@/lib/db/adminApplications";
import { listQuerySchema } from "@/lib/validations/adminApplications";

export const GET = createAdminGetHandler("api/admin/applications", listQuerySchema, (filters) =>
  listApplications(filters)
);

export const POST = methodNotAllowed;
