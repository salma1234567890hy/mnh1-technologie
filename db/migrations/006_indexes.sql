-- 006_indexes.sql — Index de performance
-- Réf. : Cahier des spécifications §6.6
-- (Les clés primaires et les colonnes UNIQUE sont déjà indexées automatiquement.)

CREATE INDEX admin_session_user_expires_idx   ON admin_session   (admin_user_id, expires_at);
CREATE INDEX visitor_last_seen_idx            ON visitor         (last_seen_at);
CREATE INDEX visitor_session_visitor_idx      ON visitor_session (visitor_id, started_at);
CREATE INDEX page_view_session_idx            ON page_view       (session_id, viewed_at);
CREATE INDEX page_view_path_idx               ON page_view       (path, viewed_at);
CREATE INDEX job_offer_status_published_idx   ON job_offer       (status, published_at DESC);
CREATE INDEX application_job_offer_idx        ON application     (job_offer_id);
CREATE INDEX application_status_created_idx   ON application     (status, created_at DESC);
CREATE INDEX contact_message_created_idx      ON contact_message (created_at DESC);
CREATE INDEX admin_audit_log_created_idx      ON admin_audit_log (created_at DESC);
CREATE INDEX admin_audit_log_admin_user_idx   ON admin_audit_log (admin_user_id);