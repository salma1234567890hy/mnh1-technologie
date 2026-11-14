-- 010_job_offer_lengths.sql — Limites de longueur et format du slug des offres d'emploi (BE-09)
-- Cohérent avec lib/validations/adminJobOffers.ts (OFFER_LIMITS) et lib/slug.ts (MAX_SLUG_LENGTH = 80) :
-- la base refuse aussi ce que la validation Zod refuse, même si une écriture la contournait.

ALTER TABLE job_offer
  ADD CONSTRAINT job_offer_slug_chk        CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) <= 80),
  ADD CONSTRAINT job_offer_title_chk       CHECK (char_length(title) BETWEEN 3 AND 150),
  ADD CONSTRAINT job_offer_description_chk CHECK (char_length(description) BETWEEN 20 AND 10000),
  ADD CONSTRAINT job_offer_location_chk    CHECK (char_length(location) BETWEEN 2 AND 100);
