// app/api/admin/me/route.ts
// GET /api/admin/me — Admin actuellement connecté.
//
// ★ MODÈLE À SUIVRE POUR TOUTES LES FUTURES ROUTES /api/admin/* (RG29) :
//   1. const auth = await requireAdmin(); if ("response" in auth) return auth.response;  → 401 sans détail
//   2. traitement, avec auth.admin (id, email, full_name — jamais le password_hash) ;
//   3. TOUTES les réponses avec Cache-Control: no-store ;
//   4. erreur inattendue → 500 générique, détail uniquement dans console.error (sans jeton ni donnée personnelle) ;
//   5. aucun SQL dans la route (uniquement des fonctions de lib/db) ;
//   6. pour un GET : `await connection()` AVANT le try (cacheComponents tente de prérendre les GET ;
//      sans cela, l'interruption du prérendu par cookies() serait interceptée par le catch).
//
// Réponses : 200 { ok: true, admin } · 401 non autorisé · 500 erreur serveur.

import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";

const NO_STORE = { "Cache-Control": "no-store" } as const;

export async function GET() {
  // Rendu à chaque requête, jamais prérendu (cacheComponents).
  await connection();

  try {
    const auth = await requireAdmin();
    if ("response" in auth) return auth.response;

    const { id, email, full_name } = auth.admin;
    return Response.json({ ok: true, admin: { id, email, full_name } }, { status: 200, headers: NO_STORE });
  } catch (error) {
    console.error(
      "[api/admin/me] Erreur inattendue :",
      error instanceof Error ? `${error.name}: ${error.message}` : "erreur inconnue"
    );
    return Response.json(
      { ok: false, error: "Une erreur est survenue. Veuillez réessayer plus tard." },
      { status: 500, headers: NO_STORE }
    );
  }
}
