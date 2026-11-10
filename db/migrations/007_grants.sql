-- 007_grants.sql — Droits minimaux du rôle applicatif mnh_app
-- Réf. : Cahier des spécifications §6.6 (Droits)
-- SELECT, INSERT et UPDATE limités aux tables et colonnes nécessaires.
-- Aucun DELETE, aucun droit de modification du schéma.

-- Comptes Admin : lecture + mise à jour des champs de connexion uniquement
-- (les comptes sont créés par une procédure contrôlée, pas par l'application — RG25)
GRANT SELECT ON admin_user TO mnh_app;
GRANT UPDATE (failed_login_count, locked_until, last_login_at) ON admin_user TO mnh_app;

-- Sessions Admin
GRANT SELECT, INSERT ON admin_session TO mnh_app;
GRANT UPDATE (last_activity_at, revoked_at) ON admin_session TO mnh_app;

-- Suivi des visites
GRANT SELECT, INSERT ON visitor TO mnh_app;
GRANT UPDATE (last_seen_at) ON visitor TO mnh_app;
GRANT SELECT, INSERT ON visitor_session TO mnh_app;
GRANT UPDATE (last_activity_at) ON visitor_session TO mnh_app;
GRANT SELECT, INSERT ON page_view TO mnh_app;

-- Offres : tout sauf l'identifiant, le créateur et la date de création
GRANT SELECT, INSERT ON job_offer TO mnh_app;
GRANT UPDATE (slug, title, description, missions, required_skills, contract_type,
              location, status, published_at, closing_date, updated_at) ON job_offer TO mnh_app;

-- Candidatures : seul le statut est modifiable
GRANT SELECT, INSERT ON application TO mnh_app;
GRANT UPDATE (status, status_updated_at, reviewed_by) ON application TO mnh_app;

-- Messages de contact : seul le statut est modifiable
GRANT SELECT, INSERT ON contact_message TO mnh_app;
GRANT UPDATE (status) ON contact_message TO mnh_app;

-- Journal d'audit : écriture seule (pas de modification)
GRANT SELECT, INSERT ON admin_audit_log TO mnh_app;
 