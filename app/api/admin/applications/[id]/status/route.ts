// app/api/admin/applications/[id]/status/route.ts
// PATCH /api/admin/applications/:id/status — changement de statut d'une candidature (BE-08).
// Corps : { "status": "EN_COURS_EXAMEN" | "ACCEPTEE" | "REFUSEE" | "EN_ATTENTE" }.
// Règles de transition : ALLOWED_STATUS_TRANSITIONS (lib/validations/adminApplications.ts).
// Chaque changement réussi écrit l'audit UPDATE_APPLICATION_STATUS avec metadata { from, to } ;
// un refus (statut identique, transition interdite) n'écrit rien.
// Ordre : connection → requireAdmin (401) → Origin (403) → id (400) → Content-Type (415) → taille (413)
//         → JSON (400) → schéma (400) → mise à jour (404 / 409 / 200).
// Réponses : 200 { data: { id, from, to } } · 400 · 401 · 403 · 404 · 405 · 409 · 413 · 415 · 500.
// Toutes : Cache-Control: private, no-store.

import { connection, type NextRequest } from "next/server";
import { z } from "zod";
import {
  adminJson,
  adminServerError,
  methodNotAllowedWith,
  withAdminCacheHeader,
} from "@/lib/api/admin-route";
import { getContentType, isDeclaredBodyTooLarge, isOriginAllowed, readBodyWithLimit } from "@/lib/api/request-guards";
import { requireAdmin } from "@/lib/auth/require-admin";
import { updateApplicationStatus } from "@/lib/db/adminApplications";
import {
  ALLOWED_STATUS_TRANSITIONS,
  idParamSchema,
  updateStatusSchema,
} from "@/lib/validations/adminApplications";

const LABEL = "api/admin/applications/[id]/status";
const MAX_BODY_BYTES = 1024;

function invalid(error: string, zodError?: z.ZodError): Response {
  if (!zodError) return adminJson(400, { error });
  const { formErrors, fieldErrors } = z.flattenError(zodError);
  return adminJson(400, { error, details: { formErrors, fieldErrors } });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  // a) Rendu à chaque requête, avant le try.
  await connection();

  try {
    // b) Authentification
    const auth = await requireAdmin();
    if ("response" in auth) return withAdminCacheHeader(auth.response);

    // c) Origine
    if (!isOriginAllowed(request)) {
      return adminJson(403, { error: "Origine non autorisée." });
    }

    // d) Identifiant
    const parsedId = idParamSchema.safeParse(await context.params);
    if (!parsedId.success) return invalid("Paramètres invalides.", parsedId.error);
    const id = parsedId.data.id;

    // e) Type de contenu
    if (getContentType(request) !== "application/json") {
      return adminJson(415, { error: "Type de contenu non pris en charge." });
    }

    // f) Taille annoncée, puis lecture plafonnée
    if (isDeclaredBodyTooLarge(request, MAX_BODY_BYTES)) {
      return adminJson(413, { error: "Requête trop volumineuse." });
    }
    const text = await readBodyWithLimit(request, MAX_BODY_BYTES);
    if (text === null) {
      return adminJson(413, { error: "Requête trop volumineuse." });
    }

    // g) JSON
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return invalid("Requête invalide.");
    }

    // h) Schéma
    const parsedBody = updateStatusSchema.safeParse(body);
    if (!parsedBody.success) return invalid("Données invalides.", parsedBody.error);

    // i) Mise à jour (transaction + audit dans lib/db/adminApplications.ts)
    const result = await updateApplicationStatus(id, parsedBody.data.status, auth.admin.id);

    if (result === null) {
      return adminJson(404, { error: "Candidature introuvable." });
    }
    if (!result.updated && result.reason === "SAME_STATUS") {
      return adminJson(409, { error: "La candidature a déjà ce statut.", current: result.current });
    }
    if (!result.updated) {
      return adminJson(409, {
        error: "Changement de statut non autorisé.",
        current: result.current,
        allowed: ALLOWED_STATUS_TRANSITIONS[result.current],
      });
    }

    return adminJson(200, { data: { id, from: result.from, to: result.to } });
  } catch (error) {
    // l) Journal sans donnée personnelle (nom de l'erreur et code SQL uniquement)
    return adminServerError(LABEL, error);
  }
}

// k) Méthodes non prises en charge
export const GET = methodNotAllowedWith("PATCH");
export const POST = methodNotAllowedWith("PATCH");
