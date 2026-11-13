-- 009_audit_metadata.sql — Détails structurés des actions journalisées (BE-08)
-- metadata contient UNIQUEMENT des statuts, identifiants et codes (ex. { "from": "EN_ATTENTE", "to": "ACCEPTEE" }),
-- JAMAIS de donnée personnelle (nom, email, téléphone, nom de fichier).
-- Pas de GRANT : le droit INSERT de mnh_app porte sur toute la table, nouvelles colonnes comprises.

ALTER TABLE admin_audit_log ADD COLUMN IF NOT EXISTS metadata jsonb;
ALTER TABLE admin_audit_log ADD CONSTRAINT admin_audit_log_metadata_chk
  CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object');
