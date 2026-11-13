// app/api/admin/logout/route.ts
// POST /api/admin/logout — déconnexion d'un Admin (RG28).
// La session est révoquée en base (si elle existe encore) et le cookie est TOUJOURS supprimé,
// même sans session valide ou en cas d'erreur.
// Réponses : 200 { ok: true } · 500 erreur serveur. Toutes : Cache-Control: no-store (RG29).

import { cookies } from "next/headers";
import { logAdminAction } from "@/lib/db/admin";
import {
  ADMIN_SESSION_COOKIE,
  destroyAdminSession,
  getClearSessionCookieOptions,
  isValidSessionTokenFormat,
} from "@/lib/auth/session";

const NO_STORE = { "Cache-Control": "no-store" } as const;

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  // Suppression du cookie : mêmes attributs que lors de sa création, Max-Age=0.
  // Posée dès maintenant, elle s'applique à toutes les réponses, y compris en cas d'erreur.
  cookieStore.set(ADMIN_SESSION_COOKIE, "", getClearSessionCookieOptions());

  try {
    if (isValidSessionTokenFormat(token)) {
      const adminId = await destroyAdminSession(token);
      // Journal uniquement si une session active a réellement été révoquée.
      if (adminId !== null) {
        await logAdminAction(adminId, "LOGOUT");
      }
    }
    return Response.json({ ok: true }, { status: 200, headers: NO_STORE });
  } catch (error) {
    // Aucun jeton dans le journal : uniquement l'erreur technique.
    console.error(
      "[api/admin/logout] Erreur inattendue :",
      error instanceof Error ? `${error.name}: ${error.message}` : "erreur inconnue"
    );
    return Response.json(
      { ok: false, error: "Une erreur est survenue. Veuillez réessayer plus tard." },
      { status: 500, headers: NO_STORE }
    );
  }
}
