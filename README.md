# PrintMate AI

A print-on-demand storefront MVP: browse a catalog, generate custom T-shirt/sticker/poster designs with AI in the **Studio**, add them to a cart, and check out with **Stripe**. Orders land in **Supabase**, trigger confirmation **emails** via **Resend**, and get routed to the nearest **print partner** by customer city. Ships 100% free on free tiers (Supabase, Vercel, Resend, Stripe test mode).

## Features

- **Storefront catalog** — products from Supabase, with built-in demo data fallback (`lib/products.ts` `DEMO_PRODUCTS`: 8 products across tees, hoodies, mugs, posters, stickers).
- **AI Studio** — text-prompt → design image, free via Pollinations (no key needed); OpenAI optional via `IMAGE_PROVIDER=openai`.
- **Cart** — React context (`lib/cart.tsx`), color/size/design variants, quantity, promo-code discounts.
- **Stripe Checkout** — test-mode payments; webhook marks orders paid and fires confirmation emails (Resend).
- **Order routing** — paid orders are assigned to the active print partner in the customer's city (fallback: first active partner); see `supabase/schema.sql` seeds.
- **Admin panel** (`/admin`, password-gated by `ADMIN_PASSWORD`) — view orders, customers, products, partners, promo codes.
- **Demo mode** — no keys at all: the whole shop works on built-in data; checkout shows a simulated flow.

## Tech stack

| Layer      | Choice                                              |
|------------|-----------------------------------------------------|
| Framework  | Next.js 14 (App Router), React 18, TypeScript        |
| Styling    | Tailwind CSS                                        |
| Database   | Supabase (Postgres + RLS)                           |
| Payments   | Stripe (Checkout + webhooks)                        |
| Email      | Resend                                              |
| AI images  | Pollinations (free, default) / OpenAI (optional)     |
| Hosting    | Vercel (free tier)                                  |

## Quickstart

```bash
cd ~/workspace/printmate-ai
npm install

# Local demo (no keys needed):
npm run dev
# → open http://localhost:3000

# Full local (Supabase + Stripe test):
cp .env.example .env.local     # then fill in values
# Run supabase/schema.sql in your Supabase project's SQL Editor
npm run dev
```

1. `npm install` — install dependencies.
2. `cp .env.example .env.local` — copy and fill in keys (skip entirely for demo mode).
3. **Supabase schema** — in the Supabase dashboard, open SQL Editor, paste `supabase/schema.sql`, click Run. It seeds 8 products, 3 print partners, 2 promo codes.
4. `npm run dev` — open http://localhost:3000.

## Demo mode (no keys)

If `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are missing, `lib/supabase.ts` returns `null` and the app falls back to `DEMO_PRODUCTS` automatically — no crash, no config. Catalog, studio, cart all work. Checkout in demo mode simulates the flow without contacting Stripe (no keys = no real payment). The moment you add real Supabase + Stripe keys, the app switches to live data and real test checkout.

## Admin

- Visit `/admin` and sign in with the password in `ADMIN_PASSWORD` (generate with `openssl rand -base64 24`).
- The admin uses the service-role key (server-side, bypasses RLS) to list orders, customers, products, partners, and promo codes. Storefront visitors (anon key) can only **read active products** and **insert orders/customers** — nothing else.

## Project structure

```
printmate-ai/
├── app/                    # Next.js App Router pages (layout.tsx, storefront, studio, checkout, admin)
├── components/             # shared React components
├── lib/
│   ├── types.ts            # shared types: Product, CartItem, OrderRecord, PrintPartner, PromoCode…
│   ├── products.ts         # DEMO_PRODUCTS + getProducts()/getProduct() (Supabase → demo fallback)
│   ├── supabase.ts         # server Supabase client (service_role, null when unconfigured)
│   ├── supabase-browser.ts # browser Supabase client (anon key)
│   ├── cart.tsx            # cart context: items, qty, promo discounts
│   └── format.ts           # formatPrice (integer cents → $X.XX)
├── supabase/
│   └── schema.sql          # tables, RLS policies, seed data (run once in SQL Editor)
├── .env.example            # every env var, documented
├── next.config.js          # images.remotePatterns: picsum.photos, image.pollinations.ai
├── DEPLOY.md               # step-by-step deploy guide for a non-technical owner
└── package.json
```

## How order routing works

1. Customer completes Stripe checkout → webhook (`checkout.session.completed`) verifies the `STRIPE_WEBHOOK_SECRET` signature and inserts/updates the `orders` row with status `paid`.
2. Server looks up `print_partners` for an active partner whose `city` matches the order's city; if none matches, it falls back to the first active partner. The order's `print_partner_id` is set and status moves to `sent_to_printer`.
3. Confirmation email goes to the customer; order details go to the partner's email (Resend).
4. Everything is visible in `/admin` and the Supabase `orders` table.

## Stripe test card

Use this at checkout while Stripe is in **test mode** — no real money moves:

| Field   | Value                          |
|---------|--------------------------------|
| Number  | `4242 4242 4242 4242`          |
| Expiry  | any future date, e.g. `12/30`  |
| CVC     | any 3 digits, e.g. `123`       |
| Name/ZIP| anything                       |

Decline test: `4000 0000 0000 0002`.

## Deploying

See **DEPLOY.md** for the full owner-friendly guide: free accounts → GitHub → Supabase → Resend → Vercel → Stripe webhook → smoke test → test-to-live checklist.
