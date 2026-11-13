// app/api/analytics/track/route.ts
// POST /api/analytics/track — enregistrement pseudonyme d'une page vue (RG03 à RG08).
// Route publique, appelée par le navigateur (fetch ou navigator.sendBeacon).
// Ordre des contrôles : origine → taille → type de contenu + JSON → limitation de débit → validation Zod
// → exclusions (admin, API, robots) → enregistrement → cookie visiteur.
// Réponses : 204 succès (sans corps) · 400 requête/données invalides · 403 origine refusée · 405 méthode refusée (GET)
// · 413 trop volumineux · 415 type de contenu refusé · 429 trop de requêtes · 500 erreur serveur.
// Toutes : Cache-Control: no-store.
// Vie privée : aucune IP ni aucun user-agent n'est stocké ; le journal d'erreurs ne contient ni chemin,
// ni user-agent, ni identifiant visiteur.

import { connection, NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { trackingSchema } from "@/lib/validations/analytics";
import { shouldTrack, trackPageView } from "@/lib/db/analytics";
import { getClientIp, rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

const MAX_BODY_BYTES = 4096;

/** Cookie pseudonyme du visiteur : 13 mois maximum (recommandation CNIL pour les traceurs de mesure d'audience). */
const VISITOR_COOKIE = "mnh_vid";
const VISITOR_COOKIE_MAX_AGE = 34_128_000; // 13 mois, en secondes

/** application/json (fetch) ou text/plain (navigator.sendBeacon avec une chaîne). */
const ACCEPTED_CONTENT_TYPES = ["application/json", "text/plain"];

const NO_STORE = { "Cache-Control": "no-store" } as const;

function json(status: number, body: Record<string, unknown>, headers: Record<string, string> = {}) {
  return NextResponse.json(body, { status, headers: { ...NO_STORE, ...headers } });
}

function noContent() {
  return new NextResponse(null, { status: 204, headers: NO_STORE });
}

/** L'en-tête Origin, s'il est présent, doit désigner le même hôte que la requête. */
function isOriginAllowed(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (origin === null) return true; // requêtes sans Origin (ex. certains envois même origine)
  const host = request.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false; // "null" ou Origin mal formée
  }
}

/**
 * Lit le corps en texte en s'arrêtant dès qu'il dépasse maxBytes (Content-Length peut manquer ou mentir).
 * Renvoie null si le corps est trop volumineux.
 */
async function readBodyWithLimit(request: NextRequest, maxBytes: number): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

/**
 * GET explicite : 405 avec Allow et Cache-Control: no-store (la réponse 405 automatique de Next n'a ni l'un ni l'autre).
 * `await connection()` : jamais prérendu par cacheComponents.
 */
export async function GET() {
  await connection();
  return json(405, { error: "Méthode non autorisée." }, { Allow: "POST" });
}

export async function POST(request: NextRequest) {
  try {
    // a) Origine
    if (!isOriginAllowed(request)) {
      return json(403, { error: "Origine non autorisée." });
    }

    // b) Taille annoncée, puis taille réelle
    const declaredLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
      return json(413, { error: "Requête trop volumineuse." });
    }
    const text = await readBodyWithLimit(request, MAX_BODY_BYTES);
    if (text === null) {
      return json(413, { error: "Requête trop volumineuse." });
    }

    // c) Type de contenu, puis JSON
    const contentType = (request.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (!ACCEPTED_CONTENT_TYPES.includes(contentType)) {
      return json(415, { error: "Type de contenu non pris en charge." });
    }
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return json(400, { error: "Requête invalide." });
    }

    // d) Limitation de débit (l'IP reste en mémoire, jamais en base)
    const limit = rateLimit(`analytics:${getClientIp(request)}`, RATE_LIMITS.analytics);
    if (!limit.allowed) {
      return json(
        429,
        { error: "Trop de requêtes. Veuillez réessayer plus tard." },
        { "Retry-After": String(limit.retryAfterSeconds) }
      );
    }

    // e) Validation Zod (chemin relatif nettoyé, référent http(s) facultatif, aucun champ inconnu)
    const parsed = trackingSchema.safeParse(body);
    if (!parsed.success) {
      // formErrors : erreurs portant sur le corps entier (ex. champ inconnu) ; fieldErrors : erreurs par champ.
      const { formErrors, fieldErrors } = z.flattenError(parsed.error);
      return json(400, { error: "Données invalides.", details: { formErrors, fieldErrors } });
    }

    // f) Sections non suivies (/admin, /api) et robots : réponse identique, sans toucher à la base
    const userAgent = request.headers.get("user-agent");
    if (!shouldTrack(parsed.data.path, userAgent)) {
      return noContent();
    }

    // g) Cookie visiteur (un identifiant absent, falsifié ou inconnu donne un nouveau visiteur)
    const visitorCookie = request.cookies.get(VISITOR_COOKIE)?.value ?? null;

    // h) Enregistrement, puis (re)pose du cookie
    const { visitorId } = await trackPageView({
      visitorId: visitorCookie,
      path: parsed.data.path,
      referrer: parsed.data.referrer ?? null,
      userAgent,
    });

    const response = noContent();
    response.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: VISITOR_COOKIE_MAX_AGE,
    });
    return response;
  } catch (error) {
    // j) Aucun chemin, user-agent ni identifiant visiteur dans le journal : uniquement l'erreur technique.
    // Le message d'erreur n'est pas journalisé (il pourrait citer une valeur) ; seuls le nom et le code SQL le sont.
    const code = (error as { code?: unknown })?.code;
    console.error(
      "[api/analytics/track] Erreur inattendue :",
      error instanceof Error ? error.name : "erreur inconnue",
      typeof code === "string" ? `(code ${code})` : ""
    );
    return json(500, { error: "Erreur serveur." });
  }
}
