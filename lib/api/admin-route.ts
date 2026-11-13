// lib/api/admin-route.ts
// Fabrique des routes GET Admin en lecture seule (ex. /api/admin/dashboard/*), selon le modèle de
// app/api/admin/me/route.ts :
//   1. `await connection()` en premier : jamais prérendu par cacheComponents (pas d'`export const dynamic`) ;
//   2. requireAdmin() → 401 sans détail ;
//   3. validation Zod des paramètres de query → 400 { error, details: { formErrors, fieldErrors } } ;
//   4. 200 { data } ;
//   5. Cache-Control: private, no-store sur TOUTES les réponses (y compris le 401 et le 405) ;
//   6. erreur inattendue → 500 { error: "Erreur serveur." }, journal sans donnée personnelle
//      (ni paramètres, ni identité de l'Admin : seulement le nom de l'erreur et son code SQL).

import "server-only";
import { connection, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { AdminIdentity } from "@/lib/db/admin";

export const ADMIN_CACHE_CONTROL = "private, no-store";

function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return Response.json(body, { status, headers: { "Cache-Control": ADMIN_CACHE_CONTROL, ...headers } });
}

/**
 * Crée le handler GET d'une route Admin en lecture seule.
 * @param label  préfixe du journal d'erreurs (ex. "api/admin/dashboard/overview")
 * @param schema schéma Zod des paramètres de query (z.strictObject)
 * @param load   chargement des données à partir des paramètres validés
 */
export function createAdminGetHandler<S extends z.ZodType>(
  label: string,
  schema: S,
  load: (params: z.infer<S>, admin: AdminIdentity) => Promise<unknown>
) {
  return async function GET(request: NextRequest): Promise<Response> {
    // Rendu à chaque requête (cacheComponents) : avant le try, pour ne jamais intercepter l'arrêt du prérendu.
    await connection();

    try {
      const auth = await requireAdmin();
      if ("response" in auth) {
        // Même réponse 401 que requireAdmin(), avec l'en-tête de cache des routes Admin.
        auth.response.headers.set("Cache-Control", ADMIN_CACHE_CONTROL);
        return auth.response;
      }

      const parsed = schema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
      if (!parsed.success) {
        const { formErrors, fieldErrors } = z.flattenError(parsed.error);
        return json(400, { error: "Paramètres invalides.", details: { formErrors, fieldErrors } });
      }

      const data = await load(parsed.data, auth.admin);
      return json(200, { data });
    } catch (error) {
      const code = (error as { code?: unknown })?.code;
      console.error(
        `[${label}] Erreur inattendue :`,
        error instanceof Error ? error.name : "erreur inconnue",
        typeof code === "string" ? `(code ${code})` : ""
      );
      return json(500, { error: "Erreur serveur." });
    }
  };
}

/**
 * Handler 405 pour les méthodes non prises en charge (la réponse 405 automatique de Next
 * n'a ni Allow ni Cache-Control).
 */
export async function methodNotAllowed(): Promise<Response> {
  return json(405, { error: "Méthode non autorisée." }, { Allow: "GET" });
}
