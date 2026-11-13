// lib/api/request-guards.ts
// Contrôles communs aux routes qui reçoivent un corps : origine de la requête et lecture plafonnée du corps.
// Utilisé par POST /api/analytics/track et PATCH /api/admin/applications/[id]/status.

import "server-only";

/**
 * L'en-tête Origin, s'il est présent, doit désigner le même hôte que la requête (en-tête Host).
 * Absent → accepté (certains envois même origine n'en ont pas). "null" ou mal formé → refusé.
 */
export function isOriginAllowed(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (origin === null) return true;
  const host = request.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** La taille annoncée (Content-Length) dépasse-t-elle la limite ? (absente ou illisible → non) */
export function isDeclaredBodyTooLarge(request: Request, maxBytes: number): boolean {
  const declared = Number(request.headers.get("content-length"));
  return Number.isFinite(declared) && declared > maxBytes;
}

/**
 * Lit le corps en texte en s'arrêtant dès qu'il dépasse maxBytes (Content-Length peut manquer ou mentir).
 * Renvoie null si le corps est trop volumineux.
 */
export async function readBodyWithLimit(request: Request, maxBytes: number): Promise<string | null> {
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

/** Type de contenu de la requête, sans paramètres (ex. "application/json"), en minuscules. */
export function getContentType(request: Request): string {
  return (request.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
}
