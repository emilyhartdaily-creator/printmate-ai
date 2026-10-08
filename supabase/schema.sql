-- ============================================================================
-- PrintMate AI — Supabase schema
-- ============================================================================
-- Run this in the Supabase dashboard: SQL Editor → New query → paste → Run.
--
-- Idempotent-ish: all CREATEs use IF NOT EXISTS and every policy is dropped
-- before being created, so re-running this file is safe. Seed rows use
-- INSERT ... ON CONFLICT DO NOTHING so they never duplicate.
--
-- Money is stored as INTEGER cents everywhere.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  base_price  INTEGER NOT NULL,          -- cents
  category    TEXT NOT NULL,             -- tshirts|hoodies|mugs|posters|stickers
  image_url   TEXT DEFAULT '',
  colors      TEXT[] NOT NULL DEFAULT '{}',
  sizes       TEXT[] NOT NULL DEFAULT '{}',
  tags        TEXT[] NOT NULL DEFAULT '{}',
  collection  TEXT,                      -- memes|political-humor|romantic-gifts
  active      BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email            TEXT NOT NULL,
  customer_name    TEXT NOT NULL,
  items            JSONB NOT NULL DEFAULT '[]',  -- array of CartItem objects
  subtotal         INTEGER NOT NULL,              -- cents
  discount         INTEGER NOT NULL DEFAULT 0,   -- cents
  total            INTEGER NOT NULL,              -- cents
  currency         TEXT NOT NULL DEFAULT 'USD',
  status           TEXT NOT NULL DEFAULT 'pending',
  stripe_session_id TEXT,
  print_partner_id TEXT,
  city             TEXT,
  postal_code      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  city        TEXT,
  postal_code TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS print_partners (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  city        TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  active      BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS promo_codes (
  id          TEXT PRIMARY KEY,
  code        TEXT UNIQUE NOT NULL,
  percent_off INTEGER NOT NULL,   -- e.g. 10 = 10%
  active      BOOLEAN NOT NULL DEFAULT true
);

-- Platform settings (key/value). platform_fee_percent = YOUR cut of each
-- order in percent; printers receive the rest. Editable in the admin
-- Payouts tab.
CREATE TABLE IF NOT EXISTS platform_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Payout tracking on orders (set by the admin Payouts tab).
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payout_status TEXT NOT NULL DEFAULT 'unpaid';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payout_note  TEXT DEFAULT '';

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
-- service_role (server-side key) bypasses RLS automatically — no policy needed.
-- Only the two public storefront operations are opened up for the anon key.

ALTER TABLE products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read ACTIVE products (storefront catalog).
DROP POLICY IF EXISTS "public_read_active_products" ON products;
CREATE POLICY "public_read_active_products"
  ON products FOR SELECT
  TO anon
  USING (active = true);

-- Anyone can place an order (checkout inserts into orders).
DROP POLICY IF EXISTS "public_insert_orders" ON orders;
CREATE POLICY "public_insert_orders"
  ON orders FOR INSERT
  TO anon
  WITH CHECK (true);

-- Anyone can create a customer record (checkout upsert).
DROP POLICY IF EXISTS "public_insert_customers" ON customers;
CREATE POLICY "public_insert_customers"
  ON customers FOR INSERT
  TO anon
  WITH CHECK (true);

-- NOTE: no public SELECT/UPDATE/DELETE on orders, customers, print_partners,
-- or promo_codes. Those are only reachable with the service_role key
-- (server code: lib/supabase.ts → getSupabase()).

-- ----------------------------------------------------------------------------
-- Seed data — mirrors lib/products.ts DEMO_PRODUCTS exactly (t-shirts & mugs)
-- ----------------------------------------------------------------------------

INSERT INTO products
  (id, name, description, base_price, category, image_url, colors, sizes, tags, collection, active)
VALUES
  ('t1', 'Essential Crew Tee',
   'A heavyweight 100% cotton tee with a perfect everyday fit. Your design, printed in crisp high resolution.',
   2499, 'tshirts', 'https://picsum.photos/seed/printmate-tee1/800/800',
   ARRAY['Black','White','Navy','Heather Gray'], ARRAY['XS','S','M','L','XL','XXL'],
   ARRAY['memes','bestseller'], 'memes', true),
  ('t2', 'Vintage Wash Tee',
   'Garment-dyed tee with a lived-in vintage feel. Soft from day one, funnier every wear.',
   2799, 'tshirts', 'https://picsum.photos/seed/printmate-tee2/800/800',
   ARRAY['Washed Black','Washed Navy','Sand'], ARRAY['S','M','L','XL','XXL'],
   ARRAY['political-humor'], 'political-humor', true),
  ('t3', 'Heavyweight Boxy Tee',
   'Thick, structured boxy-fit tee with a premium streetwear feel. Built to hold bold prints.',
   2999, 'tshirts', 'https://picsum.photos/seed/printmate-tee3/800/800',
   ARRAY['Black','White','Forest'], ARRAY['S','M','L','XL','XXL'],
   ARRAY['memes','new'], 'memes', true),
  ('m1', 'Morning Roast Mug',
   '11oz ceramic mug with a glossy finish. Dishwasher and microwave safe — humor included free.',
   1499, 'mugs', 'https://picsum.photos/seed/printmate-mug1/800/800',
   ARRAY['White','Black'], ARRAY['11oz'],
   ARRAY['political-humor','funny'], 'political-humor', true),
  ('m2', 'Enamel Camp Mug',
   'Classic enamel campfire mug with a speckled finish. For slow mornings and sweet notes.',
   1899, 'mugs', 'https://picsum.photos/seed/printmate-mug2/800/800',
   ARRAY['White/Black rim','White/Coral rim'], ARRAY['12oz'],
   ARRAY['romantic-gifts'], 'romantic-gifts', true),
  ('m3', 'Magic Reveal Mug',
   'Color-changing 11oz mug — pour hot coffee and watch your design magically appear.',
   1699, 'mugs', 'https://picsum.photos/seed/printmate-mug3/800/800',
   ARRAY['Black'], ARRAY['11oz'],
   ARRAY['memes','new'], 'memes', true)
ON CONFLICT (id) DO NOTHING;

-- Retire the old broader catalog (hoodies/posters/stickers) — focus on tees & mugs.
UPDATE products SET active = false WHERE category NOT IN ('tshirts', 'mugs');

-- ----------------------------------------------------------------------------
-- Seed data — print partners (order routing targets)
-- ----------------------------------------------------------------------------

INSERT INTO print_partners (id, name, email, city, postal_code, active)
VALUES
  ('pp-khi', 'Karachi Print Hub',  'partners+karachi@example.com', 'Karachi',   '75500', true),
  ('pp-lhr', 'Lahore Print Works', 'partners+lahore@example.com',  'Lahore',    '54000', true),
  ('pp-isb', 'Islamabad Prints',   'partners+isb@example.com',     'Islamabad', '44000', true)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- Seed data — demo promo codes (feel free to delete/deactivate later)
-- ----------------------------------------------------------------------------

INSERT INTO promo_codes (id, code, percent_off, active)
VALUES
  ('promo-welcome', 'WELCOME10', 10, true),
  ('promo-studio',  'STUDIO15',  15, true)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- Seed data — platform settings
-- ----------------------------------------------------------------------------

INSERT INTO platform_settings (key, value)
VALUES ('platform_fee_percent', '30')
ON CONFLICT (key) DO NOTHING;

-- ----------------------------------------------------------------------------
-- Storage — public bucket for product photos uploaded from the admin panel
-- ----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public read product images" ON storage.objects;
CREATE POLICY "public read product images"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'product-images');

-- ----------------------------------------------------------------------------
-- Done. Sanity check:
--   SELECT count(*) FROM products WHERE active; -- expect 6 (t-shirts & mugs)
--   SELECT count(*) FROM print_partners;        -- expect 3
--   SELECT key, value FROM platform_settings;   -- platform_fee_percent = 30
-- ----------------------------------------------------------------------------
