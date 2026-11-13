// lib/auth/require-admin.ts
// Contrôle d'accès des routes /api/admin/* (RG29) : une session Admin valide est obligatoire.
// Aucune exception en cas de refus : la route renvoie directement la réponse 401 fournie.
//
//   const auth = await requireAdmin();
//   if ("response" in auth) return auth.response;
//   // … auth.admin est l'Admin connecté
//
// Une erreur technique (base indisponible…) est, elle, propagée : la route la transforme en 500.

import "server-only";
import { getAdminFromRequest } from "@/lib/auth/session";
import type { AdminIdentity } from "@/lib/db/admin";

export type RequireAdminResult = { admin: AdminIdentity } | { response: Response };

/** Réponse 401 sans aucun détail (ni sur la cause, ni sur la session). */
function unauthorizedResponse(): Response {
  return Response.json(
    { ok: false, error: "Non autorisé." },
    { status: 401, headers: { "Cache-Control": "no-store" } }
  );
}

export async function requireAdmin(): Promise<RequireAdminResult> {
  const admin = await getAdminFromRequest();
  if (!admin) {
    return { response: unauthorizedResponse() };
  }
  return { admin };
}
