// lib/api/public-read.ts
// Code commun aux routes PUBLIQUES de lecture (sans authentification), ex. /api/job-offers (BE-09).
//   a) `await connection()` ; b) limitation de débit « publicRead » → 429 + Retry-After ;
//   c) aucun paramètre de query → 400 « Paramètres invalides. » ;
//   puis chargement → 404 (données null, avec le message fourni) ou 200 { data }.
// En-têtes : Cache-Control: public, max-age=60 sur les 200 ; no-store sur toutes les erreurs.
// Erreur inattendue → 500 « Erreur serveur. », journal sans donnée personnelle (nom de l'erreur et code SQL).

import "server-only";
import { connection, type NextRequest } from "next/server";
import { getClientIp, rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export const PUBLIC_CACHE_CONTROL = "public, max-age=60";
const ERROR_CACHE_CONTROL = "no-store";

function errorJson(status: number, body: Record<string, unknown>, headers: Record<string, string> = {}): Response {
  return Response.json(body, { status, headers: { "Cache-Control": ERROR_CACHE_CONTROL, ...headers } });
}

/** Réponse 404 publique (même corps quelle que soit la raison). */
export function publicNotFound(message: string): Response {
  return errorJson(404, { error: message });
}

type PublicReadOptions<P> = {
  label: string;
  /** Message du 404 (données introuvables). */
  notFoundError: string;
  /** Chargement à partir des paramètres de route ; null → 404. */
  load: (params: P) => Promise<unknown | null>;
};

/** Handler GET d'une route publique de lecture. */
export function createPublicGetHandler<P extends Record<string, string> = Record<string, never>>(options: PublicReadOptions<P>) {
  return async function GET(request: NextRequest, context?: { params: Promise<P> }): Promise<Response> {
    // a) Rendu à chaque requête, avant le try.
    await connection();

    try {
      // b) Limitation de débit (l'IP reste en mémoire, jamais en base)
      const limit = rateLimit(`public-read:${getClientIp(request)}`, RATE_LIMITS.publicRead);
      if (!limit.allowed) {
        return errorJson(
          429,
          { error: "Trop de requêtes. Veuillez réessayer plus tard." },
          { "Retry-After": String(limit.retryAfterSeconds) }
        );
      }

      // c) Aucun paramètre de query accepté
      if ([...request.nextUrl.searchParams.keys()].length > 0) {
        return errorJson(400, { error: "Paramètres invalides." });
      }

      const params = (context ? await context.params : {}) as P;
      const data = await options.load(params);
      if (data === null) return publicNotFound(options.notFoundError);

      return Response.json({ data }, { status: 200, headers: { "Cache-Control": PUBLIC_CACHE_CONTROL } });
    } catch (error) {
      const code = (error as { code?: unknown })?.code;
      console.error(
        `[${options.label}] Erreur inattendue :`,
        error instanceof Error ? error.name : "erreur inconnue",
        typeof code === "string" ? `(code ${code})` : ""
      );
      return errorJson(500, { error: "Erreur serveur." });
    }
  };
}

/** Handler 405 des routes publiques (Allow: GET), jamais prérendu. */
export async function publicMethodNotAllowed(): Promise<Response> {
  await connection();
  return errorJson(405, { error: "Méthode non autorisée." }, { Allow: "GET" });
}
