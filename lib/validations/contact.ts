// lib/validations/contact.ts
// Schéma de validation du formulaire de contact (RG09, RG10).
// Utilisé côté serveur par POST /api/contact, et réutilisable côté client (formulaire FE-05).

import { z } from "zod";

export const CONTACT_MESSAGES = {
  full_name: "Veuillez saisir votre nom (2 à 100 caractères).",
  email: "Adresse e-mail invalide.",
  subject: "L'objet doit comporter 3 à 150 caractères.",
  message: "Le message doit comporter 10 à 2 000 caractères.",
} as const;

export const contactSchema = z.strictObject({
  full_name: z
    .string({ error: CONTACT_MESSAGES.full_name })
    .trim()
    .min(2, { error: CONTACT_MESSAGES.full_name })
    .max(100, { error: CONTACT_MESSAGES.full_name }),

  email: z
    .string({ error: CONTACT_MESSAGES.email })
    .trim()
    .toLowerCase()
    .max(254, { error: CONTACT_MESSAGES.email })
    .pipe(z.email({ error: CONTACT_MESSAGES.email })),

  subject: z
    .string({ error: CONTACT_MESSAGES.subject })
    .trim()
    .min(3, { error: CONTACT_MESSAGES.subject })
    .max(150, { error: CONTACT_MESSAGES.subject }),

  message: z
    .string({ error: CONTACT_MESSAGES.message })
    .trim()
    .min(10, { error: CONTACT_MESSAGES.message })
    .max(2000, { error: CONTACT_MESSAGES.message }),

  // Champ piège anti-spam : invisible pour les humains, doit rester vide.
  // Il est accepté par le schéma, puis contrôlé par la route.
  website: z.string().max(200).optional(),
}, {
  // Erreurs au niveau du formulaire : champ inconnu, ou corps qui n'est pas un objet.
  error: (issue) =>
    issue.code === "unrecognized_keys" ? "Champ non autorisé." : "Données du formulaire invalides.",
});

export type ContactInput = z.infer<typeof contactSchema>;