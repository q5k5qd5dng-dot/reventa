-- Handticket · esquema SQLite (portable a PostgreSQL: ver schema.postgres.sql)
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,            -- siempre en minúsculas
  pass_hash TEXT NOT NULL,               -- scrypt$N$salt$hash
  role TEXT NOT NULL DEFAULT 'user',     -- user | admin
  email_verified_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,                   -- sha256 del token (el token solo vive en la cookie)
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  ip TEXT, ua TEXT, created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
CREATE TABLE IF NOT EXISTS tokens (      -- recuperar contraseña / verificar email
  id TEXT PRIMARY KEY,                   -- sha256 del token
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,                    -- reset | verify
  expires_at INTEGER NOT NULL, used_at INTEGER
);
CREATE TABLE IF NOT EXISTS payout_accounts (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  holder TEXT NOT NULL, iban_enc TEXT NOT NULL, last4 TEXT NOT NULL, updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,                    -- JSON del evento + tipos de entrada
  starts_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES users(id),
  event_id TEXT NOT NULL REFERENCES events(id),
  type TEXT NOT NULL,
  qty INTEGER NOT NULL, qty_left INTEGER NOT NULL,
  price_cents INTEGER NOT NULL, orig_cents INTEGER NOT NULL,
  zone TEXT, row TEXT, seat TEXT, note TEXT, nominative INTEGER NOT NULL DEFAULT 0,
  pages TEXT NOT NULL DEFAULT '[]',      -- metadatos de las páginas verificadas (JSON)
  status TEXT NOT NULL DEFAULT 'active', -- active | sold | removed
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS listings_event ON listings(event_id, status);
CREATE INDEX IF NOT EXISTS listings_seller ON listings(seller_id);
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  buyer_id TEXT NOT NULL REFERENCES users(id),
  listing_id TEXT REFERENCES listings(id),
  event_id TEXT NOT NULL REFERENCES events(id),
  type TEXT NOT NULL, qty INTEGER NOT NULL,
  subtotal_cents INTEGER NOT NULL, fee_cents INTEGER NOT NULL, total_cents INTEGER NOT NULL,
  status TEXT NOT NULL,                  -- pending | paid | refunded | failed
  code TEXT NOT NULL, provider TEXT, provider_ref TEXT, created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS orders_buyer ON orders(buyer_id);
CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL REFERENCES users(id),
  event_id TEXT NOT NULL REFERENCES events(id),
  type TEXT NOT NULL, code TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'valid', created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS tickets_owner ON tickets(owner_id);
CREATE TABLE IF NOT EXISTS seller_payouts ( -- dinero retenido hasta que pasa el evento
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES users(id),
  order_id TEXT NOT NULL REFERENCES orders(id),
  amount_cents INTEGER NOT NULL,         -- subtotal menos comisión del vendedor
  status TEXT NOT NULL DEFAULT 'held',   -- held | released | paid
  release_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, action TEXT NOT NULL, meta TEXT, ip TEXT, at INTEGER NOT NULL
);

-- ═════ Administración, facturación y soporte ═════
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,           -- HT-2026-000001 (abono: HT-R-2026-000001)
  year INTEGER NOT NULL, seq INTEGER NOT NULL, series TEXT NOT NULL DEFAULT 'HT',
  kind TEXT NOT NULL,                    -- service (comprador) | commission (vendedor) | credit (abono)
  order_id TEXT REFERENCES orders(id), party_id TEXT, party_name TEXT NOT NULL, party_email TEXT,
  concept TEXT NOT NULL,
  base_cents INTEGER NOT NULL, vat_rate REAL NOT NULL, vat_cents INTEGER NOT NULL, total_cents INTEGER NOT NULL,
  rectifies TEXT,                        -- número de la factura que rectifica un abono
  issued_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS invoices_order ON invoices(order_id);
CREATE INDEX IF NOT EXISTS invoices_issued ON invoices(issued_at);
CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id), email TEXT, subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general', priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'open',   -- open | pending | solved
  order_code TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS support_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT, ticket_id TEXT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author TEXT NOT NULL,                  -- user | admin
  author_name TEXT, body TEXT NOT NULL, at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS risk_resolutions (
  key TEXT PRIMARY KEY, action TEXT NOT NULL, note TEXT, admin_id TEXT, at INTEGER NOT NULL
);
