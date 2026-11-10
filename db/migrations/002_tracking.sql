-- 002_tracking.sql — Suivi pseudonyme des visites (aucune IP, aucune donnée personnelle)
-- Réf. : Cahier des spécifications §6.5 (visitor, visitor_session, page_view) · RG03 à RG08

CREATE TABLE visitor (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT visitor_seen_chk CHECK (last_seen_at >= first_seen_at)
);

CREATE TABLE visitor_session (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id       uuid        NOT NULL REFERENCES visitor (id) ON DELETE CASCADE,
  started_at       timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  entry_path       text        NOT NULL,
  referrer_host    text,
  device_type      text        NOT NULL,
  browser_family   text,
  CONSTRAINT visitor_session_entry_path_chk    CHECK (char_length(entry_path) <= 300),
  CONSTRAINT visitor_session_referrer_host_chk CHECK (char_length(referrer_host) <= 255),
  CONSTRAINT visitor_session_device_type_chk   CHECK (device_type IN ('DESKTOP', 'MOBILE', 'TABLET', 'AUTRE')),
  CONSTRAINT visitor_session_activity_chk      CHECK (last_activity_at >= started_at)
);

CREATE TABLE page_view (
  id         bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id uuid        NOT NULL REFERENCES visitor_session (id) ON DELETE CASCADE,
  path       text        NOT NULL,
  viewed_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT page_view_path_chk CHECK (path LIKE '/%' AND char_length(path) <= 300)
);