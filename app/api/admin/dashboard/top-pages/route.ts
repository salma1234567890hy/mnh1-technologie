// app/api/admin/dashboard/top-pages/route.ts
// GET /api/admin/dashboard/top-pages?period=7d|30d|90d&limit=1..50 — pages les plus vues (F08).
// Réponses : 200 { data } · 400 paramètres invalides · 401 non autorisé · 405 méthode refusée · 500 erreur serveur.
// Toutes : Cache-Control: private, no-store. Logique commune : lib/api/admin-route.ts.

import { createAdminGetHandler, methodNotAllowed } from "@/lib/api/admin-route";
import { getTopPages } from "@/lib/db/dashboard";
import { topPagesQuerySchema } from "@/lib/validations/dashboard";

export const GET = createAdminGetHandler("api/admin/dashboard/top-pages", topPagesQuerySchema, ({ period, limit }) =>
  getTopPages(period, limit)
);

export const POST = methodNotAllowed;
