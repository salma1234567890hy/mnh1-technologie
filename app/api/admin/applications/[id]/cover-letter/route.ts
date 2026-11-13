// app/api/admin/applications/[id]/cover-letter/route.ts
// GET /api/admin/applications/:id/cover-letter — téléchargement sécurisé de la lettre de motivation (BE-08),
// audit DOWNLOAD_COVER_LETTER. Nom de téléchargement généré : Lettre_candidature_<id>.pdf.
// Réponses : 200 (PDF) · 400 · 401 · 404 { error: "Fichier introuvable." } (aussi si aucune lettre) · 405 · 500.
// Toutes : Cache-Control: private, no-store. Logique commune : lib/api/admin-download.ts.

import { createAdminDownloadHandler } from "@/lib/api/admin-download";
import { methodNotAllowed } from "@/lib/api/admin-route";

export const GET = createAdminDownloadHandler({
  label: "api/admin/applications/[id]/cover-letter",
  kind: "cover_letter",
  folder: "cover-letters",
  auditAction: "DOWNLOAD_COVER_LETTER",
  documentCode: "COVER_LETTER",
  filenamePrefix: "Lettre_candidature",
});

export const POST = methodNotAllowed;
