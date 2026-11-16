// lib/admin/require-admin-page.ts
// Garde des PAGES Admin (Server Components) : Admin connecté, sinon redirection vers /admin/login.
//
// Pourquoi dans chaque page et pas seulement dans le layout : un layout ne se ré-exécute pas lors
// d'une navigation côté client, et il n'empêche pas le segment page d'être rendu ni d'apparaître dans
// la charge RSC (vérifié : sans ce garde, le contenu de la page figurait dans la réponse anonyme).
// Les routes /api/admin/* restent protégées par requireAdmin() de leur côté.
//
// Lit cookies() : appeler sous une frontière <Suspense> (cacheComponents).
// getCurrentAdmin() est mémoïsé par requête : layout + page = une seule lecture de session.

import "server-only";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/session";
import type { AdminIdentity } from "@/lib/db/admin";

const ADMIN_LOGIN_PATH = "/admin/login";

export async function requireAdminPage(): Promise<AdminIdentity> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect(ADMIN_LOGIN_PATH);
  return admin;
}
