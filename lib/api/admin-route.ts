// lib/api/admin-route.ts
// Fabriques des routes GET Admin en lecture seule (ex. /api/admin/dashboard/*, /api/admin/applications/*),
// selon le modèle de app/api/admin/me/route.ts :
//   1. `await connection()` en premier : jamais prérendu par cacheComponents (pas d'`export const dynamic`) ;
//   2. requireAdmin() → 401 sans détail ;
//   3. validation Zod des paramètres de route (si la route en a) puis de la query
//      → 400 { error, details: { formErrors, fieldErrors } } ;
//   4. données null → 404 { error: notFoundError } (si la route le prévoit), sinon 200 { data } ;
//   5. Cache-Control: private, no-store sur TOUTES les réponses (y compris le 401 et le 405) ;
//   6. erreur inattendue → 500 { error: "Erreur serveur." }, journal sans donnée personnelle
//      (ni paramètres, ni identité de l'Admin : seulement le nom de l'erreur et son code SQL).

import "server-only";
import { connection, type NextRequest } from "next/server";
import { z } from "zod";
import { getContentType, isDeclaredBodyTooLarge, readBodyWithLimit } from "@/lib/api/request-guards";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { AdminIdentity } from "@/lib/db/admin";

export const ADMIN_CACHE_CONTROL = "private, no-store";

/** Query vide : aucun paramètre accepté (?foo=1 → 400 « Paramètre non autorisé. »). */
export const noQueryParamsSchema = z.strictObject(
  {},
  {
    error: (issue) =>
      issue.code === "unrecognized_keys" ? "Paramètre non autorisé." : "Paramètres invalides.",
  }
);

/** Réponse JSON d'une route Admin, toujours avec Cache-Control: private, no-store. */
export function adminJson(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return Response.json(body, { status, headers: { "Cache-Control": ADMIN_CACHE_CONTROL, ...headers } });
}

const json = adminJson;

/** Réponse 401 de requireAdmin(), avec l'en-tête de cache des routes Admin (statut et corps inchangés). */
export function withAdminCacheHeader(response: Response): Response {
  response.headers.set("Cache-Control", ADMIN_CACHE_CONTROL);
  return response;
}

/**
 * Lecture du corps JSON d'une écriture Admin, dans cet ordre :
 * Content-Type application/json (sinon 415) → taille annoncée puis lecture plafonnée (sinon 413)
 * → JSON valide (sinon 400 « Requête invalide. »). Le contrôle d'Origin reste à la charge de la route.
 */
export async function readAdminJsonBody(
  request: Request,
  maxBytes: number
): Promise<{ ok: true; body: unknown } | { ok: false; response: Response }> {
  if (getContentType(request) !== "application/json") {
    return { ok: false, response: json(415, { error: "Type de contenu non pris en charge." }) };
  }
  if (isDeclaredBodyTooLarge(request, maxBytes)) {
    return { ok: false, response: json(413, { error: "Requête trop volumineuse." }) };
  }
  const text = await readBodyWithLimit(request, maxBytes);
  if (text === null) {
    return { ok: false, response: json(413, { error: "Requête trop volumineuse." }) };
  }
  try {
    return { ok: true, body: JSON.parse(text) };
  } catch {
    return { ok: false, response: json(400, { error: "Requête invalide." }) };
  }
}

/** 400 « Données invalides. » avec details { formErrors, fieldErrors } (validation d'un corps). */
export function adminInvalidBody(error: z.ZodError): Response {
  const { formErrors, fieldErrors } = z.flattenError(error);
  return json(400, { error: "Données invalides.", details: { formErrors, fieldErrors } });
}

/** Message et journal communs aux erreurs inattendues : nom de l'erreur et code SQL uniquement. */
export function adminServerError(label: string, error: unknown): Response {
  const code = (error as { code?: unknown })?.code;
  console.error(
    `[${label}] Erreur inattendue :`,
    error instanceof Error ? error.name : "erreur inconnue",
    typeof code === "string" ? `(code ${code})` : ""
  );
  return json(500, { error: "Erreur serveur." });
}

/** 400 « Paramètres invalides. » avec details { formErrors, fieldErrors }. */
export function adminInvalidParams(error: z.ZodError): Response {
  const { formErrors, fieldErrors } = z.flattenError(error);
  return json(400, { error: "Paramètres invalides.", details: { formErrors, fieldErrors } });
}

type RouteContext = { params: Promise<Record<string, string | string[] | undefined>> };

type CoreOptions<Q extends z.ZodType, P extends z.ZodType | undefined> = {
  label: string;
  querySchema: Q;
  paramsSchema?: P;
  /** Message du 404 quand load renvoie null (sinon null est renvoyé tel quel dans data). */
  notFoundError?: string;
};

/** Cœur commun : connection → auth → paramètres de route → query → chargement → réponse. */
function createCore<Q extends z.ZodType, P extends z.ZodType | undefined>(
  options: CoreOptions<Q, P>,
  load: (input: { query: z.infer<Q>; params: P extends z.ZodType ? z.infer<P> : undefined; admin: AdminIdentity }) => Promise<unknown>
) {
  return async function GET(request: NextRequest, context?: RouteContext): Promise<Response> {
    // Rendu à chaque requête (cacheComponents) : avant le try, pour ne jamais intercepter l'arrêt du prérendu.
    await connection();

    try {
      const auth = await requireAdmin();
      if ("response" in auth) return withAdminCacheHeader(auth.response);

      let params: unknown = undefined;
      if (options.paramsSchema) {
        const parsedParams = options.paramsSchema.safeParse(context ? await context.params : {});
        if (!parsedParams.success) return adminInvalidParams(parsedParams.error);
        params = parsedParams.data;
      }

      const parsedQuery = options.querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
      if (!parsedQuery.success) return adminInvalidParams(parsedQuery.error);

      const data = await load({
        query: parsedQuery.data,
        params: params as P extends z.ZodType ? z.infer<P> : undefined,
        admin: auth.admin,
      });

      if (data === null && options.notFoundError) {
        return json(404, { error: options.notFoundError });
      }
      return json(200, { data });
    } catch (error) {
      return adminServerError(options.label, error);
    }
  };
}

/**
 * Handler GET d'une route Admin sans paramètre de route (ex. /api/admin/dashboard/overview).
 * @param label  préfixe du journal d'erreurs (ex. "api/admin/dashboard/overview")
 * @param schema schéma Zod des paramètres de query (z.strictObject)
 * @param load   chargement des données à partir des paramètres validés
 */
export function createAdminGetHandler<S extends z.ZodType>(
  label: string,
  schema: S,
  load: (params: z.infer<S>, admin: AdminIdentity) => Promise<unknown>
) {
  const core = createCore({ label, querySchema: schema }, ({ query, admin }) => load(query, admin));
  return (request: NextRequest) => core(request);
}

/**
 * Handler GET d'une route Admin avec paramètres dynamiques (ex. /api/admin/applications/[id]).
 * Next 16 : context.params est une Promise. Ordre : auth → params (400) → query (400) → null → 404 → 200.
 */
export function createAdminGetByParamsHandler<P extends z.ZodType, Q extends z.ZodType>(
  options: { label: string; paramsSchema: P; querySchema: Q; notFoundError: string },
  load: (input: { params: z.infer<P>; query: z.infer<Q>; admin: AdminIdentity }) => Promise<unknown>
) {
  const core = createCore<Q, P>(options, ({ params, query, admin }) =>
    load({ params: params as z.infer<P>, query, admin })
  );
  return (request: NextRequest, context: { params: Promise<Record<string, string>> }) => core(request, context);
}

/**
 * Handler 405 pour les méthodes non prises en charge (la réponse 405 automatique de Next
 * n'a ni Allow ni Cache-Control).
 */
export async function methodNotAllowed(): Promise<Response> {
  return json(405, { error: "Méthode non autorisée." }, { Allow: "GET" });
}

/**
 * Handler 405 avec un en-tête Allow au choix (ex. "PATCH").
 * `await connection()` : utilisable aussi comme GET sans jamais être prérendu par cacheComponents.
 */
export function methodNotAllowedWith(allow: string) {
  return async function handler(): Promise<Response> {
    await connection();
    return json(405, { error: "Méthode non autorisée." }, { Allow: allow });
  };
}
