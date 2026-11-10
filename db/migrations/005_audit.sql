-- 005_audit.sql — Journal des opérations sensibles des administrateurs
-- Réf. : Cahier des spécifications §6.5 (admin_audit_log) · RG20, RG21
-- Liste des actions : celles nommées dans le cahier (LOGIN, LOGOUT, DOWNLOAD_CV,
-- UPDATE_APPLICATION_STATUS, CREATE_OFFER, PUBLISH_OFFER), complétée pour les autres
-- opérations sensibles décrites (lettre de motivation, modification et cycle de vie des offres).

CREATE TABLE admin_audit_log (
  id            bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  admin_user_id integer     NOT NULL REFERENCES admin_user (id) ON DELETE RESTRICT,
  action        text        NOT NULL,
  entity_type   text,
  entity_id     integer,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_audit_log_action_chk CHECK (action IN (
    'LOGIN',
    'LOGOUT',
    'DOWNLOAD_CV',
    'DOWNLOAD_COVER_LETTER',
    'UPDATE_APPLICATION_STATUS',
    'CREATE_OFFER',
    'UPDATE_OFFER',
    'PUBLISH_OFFER',
    'DEACTIVATE_OFFER',
    'ARCHIVE_OFFER'
  ))
);