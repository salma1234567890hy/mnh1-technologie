// lib/client/api-client.ts
// Client HTTP du NAVIGATEUR pour les routes /api du site (même origine).
// ⚠️ Aucun import de module serveur ici (lib/db, lib/auth, lib/api…) : uniquement `import type` depuis lib/types.
//
//   const result = await apiFetch<{ data: PublicJobOfferJson[] }>("/api/job-offers");
//   if (result.ok) result.data.data … else result.error / result.fieldErrors / result.retryAfter
//
// Formats d'erreur lus (tels qu'émis par les routes existantes) :
//   { ok: false, error, fieldErrors?, formErrors? }        → /api/contact, /api/applications
//   { error, details: { fieldErrors, formErrors } }       → /api/admin/*, /api/analytics/track
//   en-tête Retry-After (secondes) sur les 429.

import type { FieldErrors } from "@/lib/types/api";

export const NETWORK_ERROR_MESSAGE = "Connexion impossible. Vérifiez votre réseau et réessayez.";
const GENERIC_ERROR_MESSAGE = "Une erreur est survenue. Veuillez réessayer plus tard.";

export const ADMIN_LOGIN_PATH = "/admin/login";

export type ApiSuccess<T> = { ok: true; status: number; data: T };

export type ApiFailure = {
  ok: false;
  /** Code HTTP, ou 0 si la requête n'a pas abouti (réseau, CORS, abandon). */
  status: number;
  /** Message lisible, prêt à être affiché. */
  error: string;
  fieldErrors?: FieldErrors;
  formErrors?: string[];
  /** Délai d'attente conseillé en secondes (429). */
  retryAfter?: number;
};

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export type ApiFetchOptions = Omit<RequestInit, "body" | "credentials"> & {
  /** Objet sérialisé en JSON (Content-Type: application/json) ou FormData (multipart, en-tête posé par le navigateur). */
  body?: unknown;
  /** Appelé sur une réponse 401 (Admin : session expirée). Voir redirectToAdminLogin. */
  onUnauthorized?: () => void;
};

/**
 * Redirection vers la connexion Admin (à passer en onUnauthorized).
 * Rechargement COMPLET volontaire (et non router.push) : il vide le cache du routeur client,
 * qui peut contenir des pages Admin déjà rendues ; replace() évite de revenir en arrière dessus.
 */
export function redirectToAdminLogin(): void {
  if (typeof window !== "undefined") window.location.replace(ADMIN_LOGIN_PATH);
}

/**
 * Appel d'une route /api du site. Ne lève jamais d'exception : renvoie toujours un ApiResult.
 * Les URL doivent être relatives et commencer par "/" (même origine, cookies envoyés).
 */
export async function apiFetch<T = unknown>(path: string, options: ApiFetchOptions = {}): Promise<ApiResult<T>> {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error(`apiFetch : URL relative attendue (« /api/… »), reçu « ${path} ».`);
  }

  const { body, onUnauthorized, headers: initHeaders, ...init } = options;
  const headers = new Headers(initHeaders);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  let requestBody: BodyInit | undefined;
  if (body instanceof FormData) {
    requestBody = body; // le navigateur pose Content-Type: multipart/form-data; boundary=…
  } else if (body !== undefined) {
    headers.set("Content-Type", "application/json");
    requestBody = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(path, { ...init, headers, body: requestBody, credentials: "same-origin" });
  } catch (error) {
    // Abandon volontaire (AbortController) : on le signale comme tel, sans message réseau trompeur.
    if (error instanceof DOMException && error.name === "AbortError") {
      return { ok: false, status: 0, error: "Requête annulée." };
    }
    return { ok: false, status: 0, error: NETWORK_ERROR_MESSAGE };
  }

  const payload = await readJson(response);

  if (response.ok) {
    return { ok: true, status: response.status, data: payload as T };
  }

  if (response.status === 401) onUnauthorized?.();

  return toFailure(response, payload);
}

/** Corps JSON de la réponse, ou undefined (204, corps vide ou non JSON). */
async function readJson(response: Response): Promise<unknown> {
  if (response.status === 204 || response.status === 205) return undefined;
  const text = await response.text().catch(() => "");
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function toFailure(response: Response, payload: unknown): ApiFailure {
  const body = isRecord(payload) ? payload : {};
  const details = isRecord(body.details) ? body.details : {};

  const failure: ApiFailure = {
    ok: false,
    status: response.status,
    error: typeof body.error === "string" && body.error ? body.error : GENERIC_ERROR_MESSAGE,
  };

  const fieldErrors = asFieldErrors(body.fieldErrors) ?? asFieldErrors(details.fieldErrors);
  if (fieldErrors) failure.fieldErrors = fieldErrors;

  const formErrors = asStringArray(body.formErrors) ?? asStringArray(details.formErrors);
  if (formErrors) failure.formErrors = formErrors;

  const retryAfter = parseRetryAfter(response.headers.get("Retry-After"));
  if (retryAfter !== undefined) failure.retryAfter = retryAfter;

  return failure;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asStringArray(value: unknown): string[] | undefined {
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : undefined;
}

function asFieldErrors(value: unknown): FieldErrors | undefined {
  if (!isRecord(value)) return undefined;
  const result: FieldErrors = {};
  for (const [field, messages] of Object.entries(value)) {
    const list = asStringArray(messages);
    if (list) result[field] = list;
  }
  return result;
}

/** Retry-After : nombre de secondes, ou date HTTP (convertie en secondes restantes). */
function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds);
  const date = Date.parse(value);
  return Number.isNaN(date) ? undefined : Math.max(0, Math.ceil((date - Date.now()) / 1000));
}
