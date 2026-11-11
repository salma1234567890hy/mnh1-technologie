// lib/db/contact.ts
// Accès aux données : messages du formulaire de contact (table contact_message).
// Requête SQL paramétrée uniquement ($1, $2…) — aucune concaténation de valeurs.

import { query } from "@/lib/db";
import type { ContactInput } from "@/lib/validations/contact";

export type NewContactMessage = Omit<ContactInput, "website">;

/** Enregistre un message de contact avec le statut NOUVEAU (RG11) et renvoie son identifiant. */
export async function createContactMessage(input: NewContactMessage) {
  const { rows } = await query<{ id: number; created_at: Date }>(
    `INSERT INTO contact_message (full_name, email, subject, message)
     VALUES ($1, $2, $3, $4)
     RETURNING id, created_at`,
    [input.full_name, input.email, input.subject, input.message]
  );
  return rows[0];
}