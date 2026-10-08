import { NextRequest, NextResponse } from 'next/server';
import type { CartItem } from '@/lib/types';
import { getStripe } from '@/lib/stripe';
import { getSupabase } from '@/lib/supabase';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Built-in promo codes used when Supabase is not configured. */
const FALLBACK_PROMOS: Record<string, number> = {
  WELCOME10: 10,
  STUDIO15: 15,
};

function appUrl(req: NextRequest): string {
  const env = process.env.NEXT_PUBLIC_APP_URL;
  if (env) return env.replace(/\/$/, '');
  const proto = req.headers.get('x-forwarded-proto') ?? 'http';
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  return host ? `${proto}://${host}` : 'http://localhost:3000';
}

async function resolvePromoPercent(code: string): Promise<number | null> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('promo_codes')
        .select('percent_off')
        .ilike('code', normalized)
        .eq('active', true)
        .limit(1)
        .maybeSingle();
      if (!error && data) return Number(data.percent_off) || null;
    } catch {
      /* fall through to fallback map */
    }
  }
  return FALLBACK_PROMOS[normalized] ?? null;
}

interface CheckoutBody {
  items?: CartItem[];
  email?: string;
  name?: string;
  city?: string;
  postal_code?: string;
  promoCode?: string;
}

export async function POST(req: NextRequest) {
  let body: CheckoutBody;
  try {
    body = (await req.json()) as CheckoutBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items : [];
  const email = (body.email ?? '').trim();
  const name = (body.name ?? '').trim();
  const city = (body.city ?? '').trim();
  const postal_code = (body.postal_code ?? '').trim();
  const promoCode = (body.promoCode ?? '').trim();

  if (items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
  }
  for (const item of items) {
    if (
      !item ||
      typeof item.base_price !== 'number' ||
      item.base_price < 0 ||
      typeof item.qty !== 'number' ||
      item.qty < 1 ||
      !item.name
    ) {
      return NextResponse.json({ error: 'Invalid cart item' }, { status: 400 });
    }
  }

  // Server-side totals (never trust client math).
  const subtotal = items.reduce(
    (sum, i) => sum + i.base_price * Math.floor(i.qty),
    0,
  );

  let promoPercent: number | null = null;
  if (promoCode) {
    promoPercent = await resolvePromoPercent(promoCode);
    if (promoPercent === null) {
      return NextResponse.json(
        { error: 'Promo code not recognized' },
        { status: 400 },
      );
    }
  }

  const discount = promoPercent ? Math.round((subtotal * promoPercent) / 100) : 0;
  const total = subtotal - discount;

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 503 },
    );
  }

  // Stripe has no negative line items, so distribute the discount across
  // the line items proportionally and fix the rounding penny on the last one.
  const factor = promoPercent ? 1 - promoPercent / 100 : 1;
  const lineItems = items.map((item) => {
    const qty = Math.floor(item.qty);
    const discountedUnit = Math.max(0, Math.round(item.base_price * factor));
    return {
      quantity: qty,
      unit: discountedUnit,
      label: `${item.name} — ${item.size} / ${item.color}`,
    };
  });
  const chargedSoFar = lineItems.reduce((s, l) => s + l.unit * l.quantity, 0);
  const pennyDiff = total - chargedSoFar;
  if (lineItems.length > 0) {
    const last = lineItems[lineItems.length - 1];
    last.unit = Math.max(0, last.unit + pennyDiff);
  }

  const base = appUrl(req);

  // Stripe metadata values cap at 500 chars, so chunk the items JSON.
  const itemsJson = JSON.stringify(items);
  const CHUNK = 450;
  const itemChunks: string[] = [];
  for (let i = 0; i < itemsJson.length; i += CHUNK) {
    itemChunks.push(itemsJson.slice(i, i + CHUNK));
  }
  if (itemChunks.length > 12) {
    return NextResponse.json(
      { error: 'Cart is too large to check out' },
      { status: 400 },
    );
  }
  const itemsMetadata: Record<string, string> = {
    item_chunks: String(itemChunks.length),
  };
  itemChunks.forEach((chunk, idx) => {
    itemsMetadata[`items_${idx}`] = chunk;
  });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems.map((l) => ({
        price_data: {
          currency: 'usd',
          product_data: { name: l.label },
          unit_amount: l.unit,
        },
        quantity: l.quantity,
      })),
      customer_email: email,
      success_url: `${base}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/cart`,
      metadata: {
        email,
        name,
        city,
        postal_code,
        promoCode: promoCode.toUpperCase(),
        subtotal: String(subtotal),
        discount: String(discount),
        total: String(total),
        ...itemsMetadata,
      },
      payment_intent_data: {
        description: `PrintMate AI order for ${email}`,
      },
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[checkout] stripe session create failed', err);
    return NextResponse.json(
      { error: 'Could not start checkout' },
      { status: 502 },
    );
  }
}
