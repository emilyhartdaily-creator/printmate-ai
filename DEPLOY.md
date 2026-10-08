# PrintMate AI — Deploy Guide

Written for a **non-technical owner**. Everything below uses **free tiers** only. You will not create any real charges; Stripe stays in **TEST mode** until you deliberately activate it (Step 8).

Estimated time: ~45–60 minutes the first time.

> ⚠️ All accounts must be created by **you** (the owner) with **your own email** — email verification and Stripe's identity/bank checks are tied to your identity. Nobody else can do these steps for you.

---

## Step 1 — Create free accounts

Sign up with your own email address at each of these:

| # | Service  | Site           | What it's for                      | Cost  |
|---|----------|----------------|------------------------------------|-------|
| 1 | GitHub   | github.com     | stores the code                    | Free  |
| 2 | Supabase | supabase.com   | database (Postgres)                | Free  |
| 3 | Resend   | resend.com     | sends order emails                 | Free  |
| 4 | Vercel   | vercel.com     | hosts the website (sign up **with GitHub**) | Free |
| 5 | Stripe   | stripe.com     | takes test payments                | Free (test mode) |

Keep every login in a safe place. Stripe will start in **test mode** — that is exactly what we want for now.

---

## Step 2 — Put the code on GitHub

Open a terminal in the project folder and run these commands one by one:

```bash
cd ~/workspace/printmate-ai
git init
git add .
git commit -m "PrintMate AI MVP"
git branch -M main
```

Now create the repo on GitHub:

1. Go to **github.com → New repository**.
2. Name it `printmate-ai`, keep it **Private** (or Public — your choice), **do not** add a README/license (the code already has them).
3. GitHub shows you a "push an existing repository" block. Copy the two commands — they look like:

```bash
git remote add origin https://github.com/YOUR-USERNAME/printmate-ai.git
git push -u origin main
```

4. If it asks for a password, use a **Personal Access Token** instead: GitHub → your profile → Settings → Developer settings → Personal access tokens → generate one with the `repo` scope, and paste it as the password.

---

## Step 3 — Supabase: create the database

1. Go to **supabase.com → New project**. Name it `printmate-ai`, set a database password (save it!), pick the region closest to you.
2. Wait ~2 minutes for the project to start.
3. Open **SQL Editor → New query**.
4. Open the file `supabase/schema.sql` from the project, **copy its entire contents**, paste into the SQL Editor, and click **Run**.
5. It should report success. Quick sanity check (run in the SQL Editor):

```sql
SELECT count(*) FROM products;       -- expect 8
SELECT count(*) FROM print_partners; -- expect 3
```

6. Copy three values from **Settings → API**:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

---

## Step 4 — Resend: email API key

1. Go to **resend.com → API Keys → Create API Key**. Name it `printmate-ai`, permission **Sending access**.
2. Copy the key (`re_...`) → `RESEND_API_KEY`.
3. Set `EMAIL_FROM` to something like `PrintMate <onboarding@resend.dev>` for testing.
4. **Important free-tier limit:** until you verify **your own domain** (Resend → Domains → add your domain, follow the DNS steps), Resend will only deliver emails to **your own account email**. That is fine for testing. Verifying a domain is required before real customers can receive emails — see Step 8.

---

## Step 5 — Vercel: deploy the site

1. Go to **vercel.com → Add New → Project → Import** your `printmate-ai` GitHub repo.
2. Before clicking Deploy, open **Environment Variables** and add **every variable** from `.env.example`, using the values you collected:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY` (`sk_test_...` from Stripe dashboard → Developers → API keys)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`pk_test_...`)
   - `RESEND_API_KEY`, `EMAIL_FROM`
   - `ADMIN_PASSWORD` — generate one: `openssl rand -base64 24` (or any strong password)
   - `NEXT_PUBLIC_APP_URL` — leave as `http://localhost:3000` for now; you will update it next
   - `IMAGE_PROVIDER=pollinations` (no key needed)
3. Click **Deploy**. Wait ~2 minutes.
4. Vercel gives you a URL like `https://printmate-ai-xyz.vercel.app` — **copy it**.
5. Go back to the project's **Settings → Environment Variables**, set `NEXT_PUBLIC_APP_URL` to that URL, and **Redeploy** (Deployments → ⋯ → Redeploy) so the value takes effect.

Your site is now live (in test mode — no real payments possible).

---

## Step 6 — Stripe webhook

The webhook tells your site "payment succeeded" so orders get recorded.

**Option A — local testing** (your computer only):

```bash
stripe login                      # one-time, opens browser to approve
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

It prints a webhook signing secret (`whsec_...`) → put it in `STRIPE_WEBHOOK_SECRET` (your `.env.local` for local dev, or Vercel env vars for production).

**Option B — production (your Vercel URL):**

1. Stripe dashboard → **Developers → Webhooks → Add endpoint**.
2. Endpoint URL: `https://<your-vercel-url>/api/webhooks/stripe`
3. Events to send: **`checkout.session.completed`**.
4. Click the endpoint → **Signing secret → Reveal** → copy (`whsec_...`) → add as `STRIPE_WEBHOOK_SECRET` in **Vercel → Settings → Environment Variables**, then **Redeploy**.

---

## Step 7 — Smoke test (test mode)

1. Open your Vercel URL. Add a product to the cart.
2. Open the **Studio**, generate a design, add it to the cart.
3. Apply promo code **`WELCOME10`** (10% off) — it should reduce the total.
4. Check out with the test card:
   - Number: **`4242 4242 4242 4242`**, any future expiry, any CVC.
5. Verify:
   - Stripe dashboard → Payments shows a **test** payment.
   - Your site's **/admin** (your `ADMIN_PASSWORD`) shows the new order with status `paid` and a `print_partner_id`.
   - Supabase → Table Editor → `orders` shows the row.
   - You receive the confirmation email (to your own address while on the free Resend tier).

If all four check out, the full loop works. 🎉

---

## Step 8 — Going LIVE: test → production checklist

Do these **only when you are ready for real money**. Stripe activation requires **your** identity documents and **your** bank account — the owner, nobody else.

- [ ] **Stripe: activate your account.** Dashboard → Activate: submit identity verification + bank/payout details (KYC). Until approved, you can only use test mode.
- [ ] **Swap the keys.** In Vercel env vars, replace `sk_test_...` → `sk_live_...` and `pk_test_...` → `pk_live_...` (Developers → API keys → toggle to Live mode). Redeploy.
- [ ] **New webhook secret for live mode.** Webhooks are separate per mode: add the same endpoint URL under **Live mode** webhooks, copy its **new** signing secret into `STRIPE_WEBHOOK_SECRET`. Redeploy.
- [ ] **Remove "test mode" labels.** The app shows demo/test indicators when keys are missing or test keys are used — with live keys these disappear automatically; double-check the storefront before announcing.
- [ ] **Resend: verify your domain.** Resend → Domains → add domain → add the DNS records at your registrar → set `EMAIL_FROM` to an address on that domain. Until then, customers won't receive emails.
- [ ] **Do one real $1 test purchase** with your own card, then refund it (Stripe → Payments → Refund). Confirms live mode end-to-end.
- [ ] **Rotate `ADMIN_PASSWORD`** to a fresh value and store it in a password manager.
- [ ] **Supabase backups:** free tier keeps 7 days — for a real store, consider the Pro backup options later.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Webhook returns **400** / orders stuck on `pending` | Wrong `STRIPE_WEBHOOK_SECRET` (or test secret used with live events) | Copy the **signing secret** from the exact webhook endpoint (test vs live are different). Update env var → Redeploy. |
| Vercel **build fails** | Missing env var | Check the build log for the variable name; add it in Vercel → Settings → Environment Variables → Redeploy. Every var in `.env.example` must exist. |
| Images not loading (broken image icons) | Host not allow-listed | `next.config.js` → `images.remotePatterns` must include the image host (already includes `picsum.photos` and `image.pollinations.ai`). If you switch providers, add the host and redeploy. |
| Catalog is empty | Schema not run, or keys missing | Run `supabase/schema.sql` in the SQL Editor; confirm `NEXT_PUBLIC_SUPABASE_URL` + keys are set. (No keys = demo data, never an empty page.) |
| Checkout button does nothing | Stripe keys missing/invalid | Check `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` are set and match the same mode (both test or both live). |
| No emails arriving | Resend free-tier limit | Unverified domains only deliver to your own account email. Verify your domain (Step 8) or check the recipient address. |
| Admin login fails | Wrong `ADMIN_PASSWORD` | Compare against the Vercel env var value exactly (no extra spaces); remember env changes need a Redeploy. |
| `stripe listen` prints nothing | Not logged in | Run `stripe login` first and approve in the browser. |

Still stuck? Check in this order: Vercel **deployment logs** (build errors) → Vercel **function logs** (runtime/webhook errors) → Stripe dashboard **Developers → Webhooks → endpoint → recent events** (delivery attempts and response codes).
