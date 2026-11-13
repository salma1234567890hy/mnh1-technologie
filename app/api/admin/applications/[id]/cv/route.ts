// app/api/admin/applications/[id]/cv/route.ts
// GET /api/admin/applications/:id/cv — téléchargement sécurisé du CV (BE-08), audit DOWNLOAD_CV.
// Nom de téléchargement généré : CV_candidature_<id>.pdf (jamais le nom d'origine).
// Réponses : 200 (PDF) · 400 · 401 · 404 { error: "Fichier introuvable." } · 405 · 500.
// Toutes : Cache-Control: private, no-store. Logique commune : lib/api/admin-download.ts.

import { createAdminDownloadHandler } from "@/lib/api/admin-download";
import { methodNotAllowed } from "@/lib/api/admin-route";

export const GET = createAdminDownloadHandler({
  label: "api/admin/applications/[id]/cv",
  kind: "cv",
  folder: "cv",
  auditAction: "DOWNLOAD_CV",
  documentCode: "CV",
  filenamePrefix: "CV_candidature",
});

export const POST = methodNotAllowed;
