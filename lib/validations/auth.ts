// lib/validations/auth.ts
// Schéma de validation du formulaire de connexion Admin (F07, RG27).
// Un seul message générique pour tous les champs, identique à la réponse 401 :
// la validation ne doit rien révéler (ni sur le format attendu, ni sur l'existence du compte).
// Utilisé côté serveur par POST /api/admin/login, et réutilisable côté client.

import { z } from "zod";

/** Message unique : même texte pour un champ invalide et pour un échec d'authentification (401). */
export const LOGIN_ERROR_MESSAGE = "Identifiants incorrects ou compte temporairement bloqué.";

export const loginSchema = z.strictObject(
  {
    email: z
      .string({ error: LOGIN_ERROR_MESSAGE })
      .trim()
      .toLowerCase()
      .max(254, { error: LOGIN_ERROR_MESSAGE })
      .pipe(z.email({ error: LOGIN_ERROR_MESSAGE })),

    // Pas de trim : les espaces font partie du mot de passe.
    // 200 caractères maximum : limite le coût du hachage argon2id face à des envois abusifs.
    password: z
      .string({ error: LOGIN_ERROR_MESSAGE })
      .min(1, { error: LOGIN_ERROR_MESSAGE })
      .max(200, { error: LOGIN_ERROR_MESSAGE }),
  },
  {
    // Erreurs au niveau du formulaire : champ inconnu ou données qui ne sont pas un objet.
    error: (issue) =>
      issue.code === "unrecognized_keys"
        ? "Le formulaire contient des champs non autorisés."
        : "Données du formulaire invalides.",
  }
);

export type LoginInput = z.infer<typeof loginSchema>;
