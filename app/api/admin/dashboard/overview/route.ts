// app/api/admin/dashboard/overview/route.ts
// GET /api/admin/dashboard/overview?period=7d|30d|90d — vue d'ensemble du dashboard (F08).
// Trafic (et évolution par rapport à la période précédente), candidatures, messages de contact, offres.
// Réponses : 200 { data } · 400 paramètres invalides · 401 non autorisé · 405 méthode refusée · 500 erreur serveur.
// Toutes : Cache-Control: private, no-store. Logique commune : lib/api/admin-route.ts.

import { createAdminGetHandler, methodNotAllowed } from "@/lib/api/admin-route";
import { getDashboardOverview } from "@/lib/db/dashboard";
import { periodQuerySchema } from "@/lib/validations/dashboard";

export const GET = createAdminGetHandler("api/admin/dashboard/overview", periodQuerySchema, ({ period }) =>
  getDashboardOverview(period)
);

export const POST = methodNotAllowed;
