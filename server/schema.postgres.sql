-- Handticket · mismo modelo para PostgreSQL (Supabase, Neon, RDS…).
-- Cambios respecto a SQLite: tipos nativos, timestamptz y JSONB.
CREATE TABLE users (
  id text PRIMARY KEY, name text NOT NULL, email citext NOT NULL UNIQUE, pass_hash text NOT NULL,
  role text NOT NULL DEFAULT 'user', email_verified_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE sessions (id text PRIMARY KEY, user_id text NOT NULL REFERENCES users ON DELETE CASCADE, expires_at timestamptz NOT NULL, ip inet, ua text, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE tokens (id text PRIMARY KEY, user_id text NOT NULL REFERENCES users ON DELETE CASCADE, kind text NOT NULL, expires_at timestamptz NOT NULL, used_at timestamptz);
CREATE TABLE payout_accounts (user_id text PRIMARY KEY REFERENCES users ON DELETE CASCADE, holder text NOT NULL, iban_enc text NOT NULL, last4 text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE events (id text PRIMARY KEY, data jsonb NOT NULL, starts_at timestamptz NOT NULL);
CREATE TABLE listings (
  id text PRIMARY KEY, seller_id text NOT NULL REFERENCES users, event_id text NOT NULL REFERENCES events, type text NOT NULL,
  qty int NOT NULL, qty_left int NOT NULL, price_cents int NOT NULL, orig_cents int NOT NULL,
  zone text, row text, seat text, note text, nominative boolean NOT NULL DEFAULT false, pages jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'active', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON listings (event_id, status); CREATE INDEX ON listings (seller_id);
CREATE TABLE orders (
  id text PRIMARY KEY, buyer_id text NOT NULL REFERENCES users, listing_id text REFERENCES listings, event_id text NOT NULL REFERENCES events,
  type text NOT NULL, qty int NOT NULL, subtotal_cents int NOT NULL, fee_cents int NOT NULL, total_cents int NOT NULL,
  status text NOT NULL, code text NOT NULL, provider text, provider_ref text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE tickets (id text PRIMARY KEY, order_id text NOT NULL REFERENCES orders ON DELETE CASCADE, owner_id text NOT NULL REFERENCES users, event_id text NOT NULL REFERENCES events, type text NOT NULL, code text NOT NULL UNIQUE, status text NOT NULL DEFAULT 'valid', created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE seller_payouts (id text PRIMARY KEY, seller_id text NOT NULL REFERENCES users, order_id text NOT NULL REFERENCES orders, amount_cents int NOT NULL, status text NOT NULL DEFAULT 'held', release_at timestamptz NOT NULL);
CREATE TABLE audit_log (id bigserial PRIMARY KEY, user_id text, action text NOT NULL, meta jsonb, ip inet, at timestamptz NOT NULL DEFAULT now());
-- Supabase: activa Row Level Security y políticas por user_id si accedes desde el cliente.

-- Administración, facturación y soporte
CREATE TABLE settings (key text PRIMARY KEY, value jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE invoices (id text PRIMARY KEY, number text NOT NULL UNIQUE, year int NOT NULL, seq int NOT NULL, series text NOT NULL DEFAULT 'HT', kind text NOT NULL, order_id text REFERENCES orders, party_id text, party_name text NOT NULL, party_email text, concept text NOT NULL, base_cents int NOT NULL, vat_rate numeric NOT NULL, vat_cents int NOT NULL, total_cents int NOT NULL, rectifies text, issued_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE support_tickets (id text PRIMARY KEY, user_id text REFERENCES users, email text, subject text NOT NULL, category text NOT NULL DEFAULT 'general', priority text NOT NULL DEFAULT 'normal', status text NOT NULL DEFAULT 'open', order_code text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE support_messages (id bigserial PRIMARY KEY, ticket_id text NOT NULL REFERENCES support_tickets ON DELETE CASCADE, author text NOT NULL, author_name text, body text NOT NULL, at timestamptz NOT NULL DEFAULT now());
CREATE TABLE risk_resolutions (key text PRIMARY KEY, action text NOT NULL, note text, admin_id text, at timestamptz NOT NULL DEFAULT now());
ALTER TABLE users ADD COLUMN banned_at timestamptz, ADD COLUMN last_login_at timestamptz;
