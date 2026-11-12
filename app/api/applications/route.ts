// app/api/applications/route.ts
// POST /api/applications — réception d'une candidature (multipart/form-data).
// Ordre des contrôles : limitation de débit → lecture du formulaire → séparation fichiers / texte
// → validation Zod → contrôle des PDF → offre ouverte (RG14) → écriture des fichiers → enregistrement.
// RG19 : si l'enregistrement échoue, tous les fichiers déjà écrits sont supprimés.
// Réponses : 201 succès · 400 données invalides · 404 offre non disponible · 429 trop de requêtes · 500 erreur serveur.

import { z } from "zod";
import { applicationSchema } from "@/lib/validations/application";
import { getOpenJobOfferById } from "@/lib/db/jobOffers";
import { createApplication } from "@/lib/db/applications";
import { deletePrivateFile, MAX_FILE_SIZE, savePrivateFile, validatePdf } from "@/lib/storage";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

// Limitation de débit : 5 candidatures / heure / adresse IP en production.
// Uniquement sous `npm run dev` (NODE_ENV = "development"), la limite passe à 50 pour permettre
// les tests manuels (scripts/test-applications-api.mjs). `next build` et `next start` utilisent
// toujours NODE_ENV = "production" : la limite de 5 s'applique alors sans exception.
const RATE_LIMIT = {
  limit: process.env.NODE_ENV === "development" ? 50 : 5,
  windowMs: 60 * 60 * 1000,
};

/** Taille maximale du corps : deux PDF de 5 Mo + les champs texte et l'enveloppe multipart. */
const MAX_BODY_BYTES = 2 * MAX_FILE_SIZE + 64 * 1024;

const FILE_FIELDS = ["cv", "cover_letter"] as const;
type FileField = (typeof FILE_FIELDS)[number];

const MESSAGES = {
  invalidRequest: "Requête invalide.",
  tooLarge: "Requête trop volumineuse.",
  duplicateField: "Un champ du formulaire a été envoyé plusieurs fois.",
  invalidFields: "Certains champs sont invalides.",
  cvRequired: "Veuillez joindre votre CV au format PDF.",
  fileInvalid: "Fichier invalide.",
  offerUnavailable: "Cette offre n'est plus disponible.",
  serverError: "Une erreur est survenue. Veuillez réessayer plus tard.",
  success: "Votre candidature a bien été envoyée.",
} as const;

function errorResponse(status: number, error: string, extra?: Record<string, unknown>) {
  return Response.json({ ok: false, error, ...extra }, { status });
}

function fieldErrorResponse(field: FileField, message: string) {
  return errorResponse(400, MESSAGES.invalidFields, { fieldErrors: { [field]: [message] }, formErrors: [] });
}

/**
 * Un champ fichier laissé vide arrive soit comme un File sans nom et de taille 0 (navigateur,
 * filename=""), soit comme une chaîne vide (client qui omet filename) : on le considère comme absent.
 */
function isEmptyFileInput(value: FormDataEntryValue | undefined): boolean {
  return (
    value === undefined ||
    value === "" ||
    (value instanceof File && value.size === 0 && value.name === "")
  );
}

/**
 * Nom d'origine conservé uniquement pour l'affichage (jamais utilisé sur le disque) :
 * sans chemin, sans caractères de contrôle, 255 caractères maximum.
 */
function cleanOriginalName(name: string, fallback: string): string {
  const baseName = name.split(/[\\/]/).pop() ?? "";
  const cleaned = baseName.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 255);
  return cleaned || fallback;
}

/** RG19 : supprime les fichiers déjà écrits. Ne lève jamais d'erreur (journalisation côté serveur). */
async function cleanupFiles(keys: string[]) {
  const results = await Promise.allSettled(keys.map((key) => deletePrivateFile(key)));
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      console.error(`[api/applications] Impossible de supprimer le fichier ${keys[i]} :`, result.reason);
    }
  });
}

export async function POST(request: Request) {
  // 1. Limitation de débit (l'IP reste en mémoire, jamais en base)
  const limit = rateLimit(`applications:${getClientIp(request)}`, RATE_LIMIT);
  if (!limit.allowed) {
    return Response.json(
      { ok: false, error: "Trop de candidatures envoyées. Veuillez réessayer plus tard." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  // 2. Lecture du formulaire multipart (refus immédiat si la taille annoncée est excessive)
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return errorResponse(400, MESSAGES.tooLarge);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse(400, MESSAGES.invalidRequest);
  }

  // 3. Séparation des fichiers et des champs texte, AVANT la validation (le schéma est strict).
  //    Un champ envoyé plusieurs fois est refusé.
  const textFields: Record<string, FormDataEntryValue> = {};
  const fileFields: Partial<Record<FileField, FormDataEntryValue>> = {};
  const seen = new Set<string>();

  for (const [name, value] of formData.entries()) {
    if (seen.has(name)) {
      return errorResponse(400, MESSAGES.duplicateField);
    }
    seen.add(name);

    if ((FILE_FIELDS as readonly string[]).includes(name)) {
      fileFields[name as FileField] = value;
    } else {
      textFields[name] = value;
    }
  }

  // 4. Validation Zod des champs texte (RG16) : erreurs par champ, champs inconnus rejetés
  const parsed = applicationSchema.safeParse(textFields);
  if (!parsed.success) {
    const { formErrors, fieldErrors } = z.flattenError(parsed.error);
    return errorResponse(400, MESSAGES.invalidFields, { fieldErrors, formErrors });
  }

  // 5. Fichiers : CV obligatoire, lettre de motivation facultative, vrais PDF de 5 Mo maximum
  const cvEntry = fileFields.cv;
  if (isEmptyFileInput(cvEntry)) {
    return fieldErrorResponse("cv", MESSAGES.cvRequired);
  }
  if (!(cvEntry instanceof File)) {
    return fieldErrorResponse("cv", MESSAGES.fileInvalid);
  }
  const cvError = await validatePdf(cvEntry);
  if (cvError) {
    return fieldErrorResponse("cv", cvError);
  }
  const cv = cvEntry;

  let coverLetter: File | null = null;
  const coverEntry = fileFields.cover_letter;
  if (!isEmptyFileInput(coverEntry)) {
    if (!(coverEntry instanceof File)) {
      return fieldErrorResponse("cover_letter", MESSAGES.fileInvalid);
    }
    const coverError = await validatePdf(coverEntry);
    if (coverError) {
      return fieldErrorResponse("cover_letter", coverError);
    }
    coverLetter = coverEntry;
  }

  // 6. L'offre doit être ouverte (RG14) avant d'écrire quoi que ce soit sur le disque
  try {
    const offer = await getOpenJobOfferById(parsed.data.job_offer_id);
    if (!offer) {
      return errorResponse(404, MESSAGES.offerUnavailable);
    }
  } catch (error) {
    console.error("[api/applications] Erreur de lecture de l'offre :", error);
    return errorResponse(500, MESSAGES.serverError);
  }

  // 7. Écriture des fichiers (noms aléatoires) puis enregistrement en base, statut EN_ATTENTE.
  //    L'insertion revérifie RG14 : l'offre a pu être fermée entre l'étape 6 et l'étape 7.
  const writtenKeys: string[] = [];
  try {
    const cvKey = await savePrivateFile(cv, "cv");
    writtenKeys.push(cvKey);

    let coverLetterKey: string | null = null;
    if (coverLetter) {
      coverLetterKey = await savePrivateFile(coverLetter, "cover-letters");
      writtenKeys.push(coverLetterKey);
    }

    const { job_offer_id, full_name, email, phone, message } = parsed.data;
    const applicationId = await createApplication({
      job_offer_id,
      full_name,
      email,
      phone,
      message,
      cv_storage_key: cvKey,
      cv_original_name: cleanOriginalName(cv.name, "cv.pdf"),
      cv_size_bytes: cv.size,
      ...(coverLetter && coverLetterKey
        ? {
            cover_letter_storage_key: coverLetterKey,
            cover_letter_original_name: cleanOriginalName(coverLetter.name, "lettre-de-motivation.pdf"),
          }
        : { cover_letter_storage_key: null, cover_letter_original_name: null }),
    });

    // 8. RG19 : offre fermée entre-temps → aucun fichier ne doit rester sur le disque
    if (applicationId === null) {
      await cleanupFiles(writtenKeys);
      return errorResponse(404, MESSAGES.offerUnavailable);
    }

    // 9. Succès
    return Response.json({ ok: true, message: MESSAGES.success }, { status: 201 });
  } catch (error) {
    // 8. RG19 : échec d'écriture ou d'enregistrement → suppression de tous les fichiers déjà écrits
    console.error("[api/applications] Erreur d'enregistrement de la candidature :", error);
    await cleanupFiles(writtenKeys);
    return errorResponse(500, MESSAGES.serverError);
  }
}
