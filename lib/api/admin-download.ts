// lib/api/admin-download.ts
// Téléchargement sécurisé des fichiers de candidature (BE-08) : code commun aux routes
// GET /api/admin/applications/[id]/cv et GET /api/admin/applications/[id]/cover-letter.
// Ordre :
//   a) `await connection()` ;
//   b) requireAdmin() → 401 ;
//   c) id → 400 ; aucun paramètre de query → 400 ;
//   d) fichier inconnu en base (candidature absente ou pas de lettre) → 404 « Fichier introuvable. » ;
//   e) fichier absent du disque, clé ou signature invalide → 404 identique + journal avec un CODE
//      (ex. FILE_MISSING), SANS chemin ni nom de fichier ;
//   f) audit écrit AVANT l'envoi : s'il échoue → 500, aucun téléchargement sans trace ;
//   g) 200 : le PDF, avec un nom GÉNÉRÉ (jamais le nom d'origine envoyé par le candidat) et des en-têtes
//      qui empêchent toute interprétation par le navigateur (nosniff, CSP sandbox) ;
//   h) erreur inattendue → 500 « Erreur serveur. », journal sans donnée personnelle.

import "server-only";
import { connection, type NextRequest } from "next/server";
import {
  ADMIN_CACHE_CONTROL,
  adminInvalidParams,
  adminJson,
  adminServerError,
  noQueryParamsSchema,
  withAdminCacheHeader,
} from "@/lib/api/admin-route";
import { requireAdmin } from "@/lib/auth/require-admin";
import { logAdminAction, type AdminAction } from "@/lib/db/admin";
import { getApplicationFile, type ApplicationFileKind } from "@/lib/db/adminApplications";
import { readPrivateFile, type StorageFolder } from "@/lib/storage";
import { idParamSchema } from "@/lib/validations/adminApplications";

type DownloadConfig = {
  label: string;
  kind: ApplicationFileKind;
  /** Dossier de stockage attendu pour ce type de fichier (refus de toute clé hors de ce dossier). */
  folder: StorageFolder;
  auditAction: Extract<AdminAction, "DOWNLOAD_CV" | "DOWNLOAD_COVER_LETTER">;
  /** Code stocké dans metadata (aucune donnée personnelle). */
  documentCode: "CV" | "COVER_LETTER";
  /** Préfixe du nom de téléchargement généré : "<prefixe>_<id>.pdf". */
  filenamePrefix: string;
};

const NOT_FOUND = "Fichier introuvable.";

export function createAdminDownloadHandler(config: DownloadConfig) {
  return async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }): Promise<Response> {
    // a) Rendu à chaque requête, avant le try.
    await connection();

    try {
      // b) Authentification
      const auth = await requireAdmin();
      if ("response" in auth) return withAdminCacheHeader(auth.response);

      // c) Identifiant, puis query vide
      const parsedId = idParamSchema.safeParse(await context.params);
      if (!parsedId.success) return adminInvalidParams(parsedId.error);
      const parsedQuery = noQueryParamsSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
      if (!parsedQuery.success) return adminInvalidParams(parsedQuery.error);
      const id = parsedId.data.id;

      // d) Fichier connu en base ?
      const file = await getApplicationFile(id, config.kind);
      if (!file) return adminJson(404, { error: NOT_FOUND });

      // e) Lecture sécurisée sur le disque (format de clé, dossier, chemin, signature %PDF-)
      const read = await readPrivateFile(file.storageKey, config.folder);
      if (!read.ok) {
        // Code technique uniquement : ni chemin, ni nom de fichier, ni donnée du candidat.
        console.error(`[${config.label}] Téléchargement impossible : ${read.reason}`);
        return adminJson(404, { error: NOT_FOUND });
      }

      // f) Audit AVANT l'envoi : en cas d'échec, l'exception mène au 500 (aucun fichier envoyé).
      await logAdminAction(auth.admin.id, config.auditAction, "application", id, {
        metadata: { document: config.documentCode },
      });

      // g) Envoi du PDF, nom généré
      return new Response(read.data as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${config.filenamePrefix}_${id}.pdf"`,
          "Content-Length": String(read.sizeBytes),
          "X-Content-Type-Options": "nosniff",
          "Content-Security-Policy": "default-src 'none'; sandbox",
          "Cache-Control": ADMIN_CACHE_CONTROL,
        },
      });
    } catch (error) {
      // h) Journal sans donnée personnelle (nom de l'erreur et code SQL uniquement)
      return adminServerError(config.label, error);
    }
  };
}
