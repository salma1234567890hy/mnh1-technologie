-- 008_dashboard_indexes.sql — Index sur les dates pour les statistiques du dashboard (F08)
-- Les requêtes de lib/db/dashboard.ts filtrent par plage de dates seule (viewed_at, started_at, created_at) ;
-- les index existants n'ont ces colonnes qu'en 2e position.

CREATE INDEX IF NOT EXISTS page_view_viewed_at_idx        ON page_view       (viewed_at);
CREATE INDEX IF NOT EXISTS visitor_session_started_at_idx ON visitor_session (started_at);
CREATE INDEX IF NOT EXISTS application_created_at_idx     ON application     (created_at);
