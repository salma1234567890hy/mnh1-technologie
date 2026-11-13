// app/api/admin/applications/[id]/route.ts
// GET /api/admin/applications/:id — détail d'une candidature (BE-08). Simple consultation : aucun audit.
// Aucun chemin ni nom de fichier stocké dans la réponse (seulement la présence et la taille des fichiers).
// Ordre : connection → requireAdmin (401) → id (400) → query vide (400) → introuvable (404) → 200 { data }.
// Réponses : 200 · 400 · 401 · 404 { error: "Candidature introuvable." } · 405 · 500.
// Toutes : Cache-Control: private, no-store. Logique commune : lib/api/admin-route.ts.

import { createAdminGetByParamsHandler, methodNotAllowed, noQueryParamsSchema } from "@/lib/api/admin-route";
import { getApplicationById } from "@/lib/db/adminApplications";
import { idParamSchema } from "@/lib/validations/adminApplications";

export const GET = createAdminGetByParamsHandler(
  {
    label: "api/admin/applications/[id]",
    paramsSchema: idParamSchema,
    querySchema: noQueryParamsSchema,
    notFoundError: "Candidature introuvable.",
  },
  ({ params }) => getApplicationById(params.id)
);

export const POST = methodNotAllowed;
