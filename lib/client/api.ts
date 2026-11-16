// lib/client/api.ts
// Fonctions typées du NAVIGATEUR pour chaque route /api utilisée par le site et l'Admin.
// Toutes renvoient un ApiResult (jamais d'exception), sauf trackPageView (envoi « fire and forget »).
// ⚠️ Aucun import de module serveur : uniquement `import type` depuis lib/types/api.ts.

import {
  apiFetch,
  redirectToAdminLogin,
  type ApiFetchOptions,
  type ApiResult,
} from "@/lib/client/api-client";
import type { AdminMe, ContactMessageInput, MessageResponse, PublicJobOfferJson } from "@/lib/types/api";

type CallOptions = Pick<ApiFetchOptions, "signal">;

/* ── Public ─────────────────────────────────────────────── */

/** GET /api/job-offers — offres ouvertes, de la plus récente à la plus ancienne. */
export async function getJobOffers(options: CallOptions = {}): Promise<ApiResult<PublicJobOfferJson[]>> {
  const result = await apiFetch<{ data: PublicJobOfferJson[] }>("/api/job-offers", options);
  return result.ok ? { ...result, data: result.data.data } : result;
}

/** GET /api/job-offers/:slug — détail d'une offre ouverte (404 si absente ou non ouverte). */
export async function getJobOffer(slug: string, options: CallOptions = {}): Promise<ApiResult<PublicJobOfferJson>> {
  const result = await apiFetch<{ data: PublicJobOfferJson }>(
    `/api/job-offers/${encodeURIComponent(slug)}`,
    options,
  );
  return result.ok ? { ...result, data: result.data.data } : result;
}

/** POST /api/contact — 201 { ok, message } ; 400 avec fieldErrors / formErrors ; 429 avec retryAfter. */
export function sendContactMessage(data: ContactMessageInput, options: CallOptions = {}): Promise<ApiResult<MessageResponse>> {
  return apiFetch<MessageResponse>("/api/contact", { ...options, method: "POST", body: data });
}

/**
 * POST /api/applications — candidature en multipart/form-data
 * (champs texte de lib/validations/application.ts + fichiers `cv` et `cover_letter` facultatif, PDF ≤ 5 Mo).
 */
export function submitApplication(formData: FormData, options: CallOptions = {}): Promise<ApiResult<MessageResponse>> {
  return apiFetch<MessageResponse>("/api/applications", { ...options, method: "POST", body: formData });
}

/**
 * POST /api/analytics/track — page vue (204 sans corps).
 * navigator.sendBeacon (survit à la fermeture de la page ; chaîne → text/plain, accepté par la route),
 * sinon fetch keepalive. Ne lève jamais d'exception ; renvoie true si l'envoi a été confié au navigateur.
 *
 * ⚠️ Pas encore branché sur les pages : le consentement aux cookies de suivi (cookie mnh_vid)
 * doit d'abord être validé par l'encadrant.
 */
export function trackPageView(path: string, referrer?: string): boolean {
  if (typeof window === "undefined") return false;

  const payload = JSON.stringify(referrer ? { path, referrer } : { path });
  const url = "/api/analytics/track";

  try {
    if (typeof navigator.sendBeacon === "function" && navigator.sendBeacon(url, payload)) {
      return true;
    }
  } catch {
    // sendBeacon indisponible ou refusé : repli sur fetch.
  }

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    credentials: "same-origin",
    keepalive: true,
  }).catch(() => {});
  return true;
}

/* ── Admin ──────────────────────────────────────────────── */

/** POST /api/admin/login — 200 { ok } et cookie de session HttpOnly ; 401 message unique ; 429 avec retryAfter. */
export function adminLogin(email: string, password: string, options: CallOptions = {}): Promise<ApiResult<{ ok: true }>> {
  return apiFetch<{ ok: true }>("/api/admin/login", { ...options, method: "POST", body: { email, password } });
}

/** POST /api/admin/logout — révoque la session et supprime le cookie (toujours 200 sauf erreur serveur). */
export function adminLogout(options: CallOptions = {}): Promise<ApiResult<{ ok: true }>> {
  return apiFetch<{ ok: true }>("/api/admin/logout", { ...options, method: "POST" });
}

/**
 * GET /api/admin/me — Admin connecté.
 * Sur 401, redirige par défaut vers /admin/login ; `onUnauthorized: null` désactive la redirection.
 */
export async function getAdminMe({
  onUnauthorized = redirectToAdminLogin,
  ...options
}: CallOptions & { onUnauthorized?: (() => void) | null } = {}): Promise<ApiResult<AdminMe>> {
  const result = await apiFetch<{ ok: true; admin: AdminMe }>("/api/admin/me", {
    ...options,
    cache: "no-store",
    onUnauthorized: onUnauthorized ?? undefined,
  });
  return result.ok ? { ...result, data: result.data.admin } : result;
}
