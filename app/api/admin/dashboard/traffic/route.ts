// app/api/admin/dashboard/traffic/route.ts
// GET /api/admin/dashboard/traffic?period=7d|30d|90d — trafic jour par jour et répartitions (F08).
// data = { series: un point par jour (jours vides à 0), breakdown: appareils, navigateurs, sources }.
// Réponses : 200 { data } · 400 paramètres invalides · 401 non autorisé · 405 méthode refusée · 500 erreur serveur.
// Toutes : Cache-Control: private, no-store. Logique commune : lib/api/admin-route.ts.

import { createAdminGetHandler, methodNotAllowed } from "@/lib/api/admin-route";
import { getTrafficBreakdown, getTrafficSeries } from "@/lib/db/dashboard";
import { periodQuerySchema } from "@/lib/validations/dashboard";

export const GET = createAdminGetHandler("api/admin/dashboard/traffic", periodQuerySchema, async ({ period }) => {
  const [series, breakdown] = await Promise.all([getTrafficSeries(period), getTrafficBreakdown(period)]);
  return { series, breakdown };
});

export const POST = methodNotAllowed;
