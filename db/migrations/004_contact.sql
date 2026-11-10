-- 004_contact.sql — Messages du formulaire de contact
-- Réf. : Cahier des spécifications §6.5 (contact_message) · RG09, RG11
-- Entité indépendante : aucun lien avec un visiteur ou un compte.

CREATE TABLE contact_message (
  id         integer     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name  text        NOT NULL,
  email      text        NOT NULL,
  subject    text        NOT NULL,
  message    text        NOT NULL,
  status     text        NOT NULL DEFAULT 'NOUVEAU',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contact_message_full_name_chk CHECK (char_length(full_name) BETWEEN 2 AND 100),
  CONSTRAINT contact_message_email_chk     CHECK (char_length(email) <= 254),
  CONSTRAINT contact_message_subject_chk   CHECK (char_length(subject) BETWEEN 3 AND 150),
  CONSTRAINT contact_message_message_chk   CHECK (char_length(message) BETWEEN 10 AND 2000),
  CONSTRAINT contact_message_status_chk    CHECK (status IN ('NOUVEAU', 'LU', 'TRAITE'))
);