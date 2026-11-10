-- 003_recruitment.sql — Offres d'emploi et candidatures
-- Réf. : Cahier des spécifications §6.5 (job_offer, application) · RG14 à RG24
-- Les CV ne sont jamais stockés en base : seulement la clé du fichier privé, son nom et sa taille.

CREATE TABLE job_offer (
  id              integer     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug            text        NOT NULL UNIQUE,
  title           text        NOT NULL,
  description     text        NOT NULL,
  missions        text[]      NOT NULL DEFAULT '{}',
  required_skills text[]      NOT NULL DEFAULT '{}',
  contract_type   text        NOT NULL,
  location        text        NOT NULL,
  status          text        NOT NULL DEFAULT 'BROUILLON',
  published_at    timestamptz,
  closing_date    date,
  created_by      integer     NOT NULL REFERENCES admin_user (id) ON DELETE RESTRICT,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT job_offer_contract_type_chk CHECK (contract_type IN ('STAGE', 'CDI', 'CDD', 'ALTERNANCE', 'FREELANCE')),
  CONSTRAINT job_offer_status_chk        CHECK (status IN ('BROUILLON', 'PUBLIEE', 'DESACTIVEE', 'ARCHIVEE')),
  CONSTRAINT job_offer_published_chk     CHECK (status <> 'PUBLIEE' OR published_at IS NOT NULL)
);

CREATE TABLE application (
  id                         integer     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  job_offer_id               integer     NOT NULL REFERENCES job_offer (id) ON DELETE RESTRICT,
  full_name                  text        NOT NULL,
  email                      text        NOT NULL,
  phone                      text        NOT NULL,
  cv_storage_key             text        NOT NULL,
  cv_original_name           text        NOT NULL,
  cv_size_bytes              integer     NOT NULL,
  cover_letter_storage_key   text,
  cover_letter_original_name text,
  message                    text,
  consent_data_processing    boolean     NOT NULL,
  consented_at               timestamptz NOT NULL DEFAULT now(),
  status                     text        NOT NULL DEFAULT 'EN_ATTENTE',
  status_updated_at          timestamptz NOT NULL DEFAULT now(),
  reviewed_by                integer     REFERENCES admin_user (id) ON DELETE SET NULL,
  created_at                 timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT application_full_name_chk    CHECK (char_length(full_name) BETWEEN 2 AND 100),
  CONSTRAINT application_email_chk        CHECK (char_length(email) <= 254),
  CONSTRAINT application_phone_chk        CHECK (char_length(phone) BETWEEN 6 AND 30),
  CONSTRAINT application_cv_size_chk      CHECK (cv_size_bytes BETWEEN 1 AND 5242880),
  CONSTRAINT application_message_chk      CHECK (char_length(message) <= 2000),
  CONSTRAINT application_consent_chk      CHECK (consent_data_processing),
  CONSTRAINT application_status_chk       CHECK (status IN ('EN_ATTENTE', 'EN_COURS_EXAMEN', 'ACCEPTEE', 'REFUSEE')),
  CONSTRAINT application_cover_letter_chk CHECK ((cover_letter_storage_key IS NULL) = (cover_letter_original_name IS NULL))
);