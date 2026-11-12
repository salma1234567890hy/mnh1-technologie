-- Données de test — développement local uniquement, ne jamais exécuter en production.
-- Ce fichier n'est pas dans db/migrations : npm run db:migrate ne l'exécute jamais.
-- Rejouable sans erreur grâce aux ON CONFLICT ... DO NOTHING.
-- À exécuter avec le rôle propriétaire (mnh_owner) : mnh_app n'a aucun droit sur admin_user.

\set ON_ERROR_STOP on

BEGIN;

-- 1. Admin de test INACTIF, sans mot de passe utilisable ('!disabled' n'est pas une empreinte argon2id valide).
INSERT INTO admin_user (email, full_name, password_hash, is_active)
VALUES ('test.admin@mnh.local', '[TEST] Admin de test', '!disabled', false)
ON CONFLICT (email) DO NOTHING;

-- 2. Offre de test PUBLIEE (ouverte : closing_date NULL, RG14).
INSERT INTO job_offer (
  slug, title, description, missions, required_skills,
  contract_type, location, status, published_at, closing_date, created_by
)
SELECT
  'test-stage-developpeur-web',
  '[TEST] Stage Développeur Web',
  '[TEST] Offre fictive destinée aux tests locaux de l''API de candidature.',
  ARRAY[
    '[TEST] Développer des interfaces web avec Next.js et React',
    '[TEST] Participer aux revues de code et aux tests'
  ],
  ARRAY['TypeScript', 'React', 'SQL'],
  'STAGE',
  'Casablanca',
  'PUBLIEE',
  now(),
  NULL,
  a.id
FROM admin_user a
WHERE a.email = 'test.admin@mnh.local'
ON CONFLICT (slug) DO NOTHING;

-- 3. Offre de test BROUILLON (jamais visible publiquement).
INSERT INTO job_offer (
  slug, title, description, missions, required_skills,
  contract_type, location, status, created_by
)
SELECT
  'test-offre-brouillon',
  '[TEST] Offre brouillon',
  '[TEST] Offre fictive non publiée, pour vérifier qu''elle reste invisible.',
  '{}',
  '{}',
  'STAGE',
  'Casablanca',
  'BROUILLON',
  a.id
FROM admin_user a
WHERE a.email = 'test.admin@mnh.local'
ON CONFLICT (slug) DO NOTHING;

COMMIT;
