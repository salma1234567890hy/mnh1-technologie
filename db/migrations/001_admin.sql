-- 001_admin.sql — Comptes et sessions des administrateurs
-- Réf. : Cahier des spécifications §6.5 (admin_user, admin_session) · RG25 à RG28

CREATE TABLE admin_user (
  id                 integer     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email              text        NOT NULL UNIQUE,
  full_name          text        NOT NULL,
  password_hash      text        NOT NULL,           -- empreinte argon2id, jamais le mot de passe
  is_active          boolean     NOT NULL DEFAULT true,
  failed_login_count smallint    NOT NULL DEFAULT 0,
  locked_until       timestamptz,
  last_login_at      timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_user_email_lower_chk   CHECK (email = lower(email)),
  CONSTRAINT admin_user_failed_count_chk  CHECK (failed_login_count >= 0)
);

CREATE TABLE admin_session (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id    integer     NOT NULL REFERENCES admin_user (id) ON DELETE CASCADE,
  token_hash       text        NOT NULL UNIQUE,      -- empreinte SHA-256 du jeton du cookie
  created_at       timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  expires_at       timestamptz NOT NULL,
  revoked_at       timestamptz,
  CONSTRAINT admin_session_expiry_chk CHECK (expires_at > created_at)
);