import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getSupabase } from '@/lib/supabase';
import {
  sendEmail,
  orderEmailHtml,
  partnerEmailHtml,
} from '@/lib/email';
import type { CartItem, OrderRecord, PrintPartner } from '@/lib/types';

function reassembleItems(metadata: Record<string, string>): CartItem[] {
  const count = parseInt(metadata.item_chunks ?? '0', 10);
  if (!count || count <= 0) return [];
  let json = '';
  for (let i = 0; i < count; i++) {
    json += metadata[`items_${i}`] ?? '';
  }
  try {
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

async function findPrintPartner(
  sb: NonNullable<ReturnType<typeof getSupabase>>,
  city: string,
  postal_code: string,
): Promise<PrintPartner | null> {
  const { data } = await sb
    .from('print_partners')
    .select('*')
    .eq('active', true);
  const partners = (data ?? []) as PrintPartner[];
  if (partners.length === 0) return null;
  if (postal_code) {
    const exact = partners.find(
      (p) => p.postal_code?.trim().toLowerCase() === postal_code.toLowerCase(),
    );
    if (exact) return exact;
  }
  if (city) {
    const cityMatch = partners.find((p) =>
      p.city?.toLowerCase().includes(city.toLowerCase()),
    );
    if (cityMatch) return cityMatch;
  }
  return partners[0] ?? null;
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'STRIPE_WEBHOOK_SECRET is not configured' },
      { status: 400 },
    );
  }
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 500 },
    );
  }

  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('[webhook] signature verification failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as {
      id: string;
      metadata?: Record<string, string>;
    };
    const metadata = session.metadata ?? {};
    const email = metadata.email ?? '';
    const name = metadata.name ?? '';
    const city = metadata.city ?? '';
    const postal_code = metadata.postal_code ?? '';
    const items = reassembleItems(metadata);
    const subtotal = parseInt(metadata.subtotal ?? '0', 10) || 0;
    const discount = parseInt(metadata.discount ?? '0', 10) || 0;
    const total = parseInt(metadata.total ?? '0', 10) || 0;

    const sb = getSupabase();
    let partner: PrintPartner | null = null;
    if (sb) {
      try {
        partner = await findPrintPartner(sb, city, postal_code);
      } catch (err) {
        console.error('[webhook] partner lookup failed', err);
      }
    }

    const orderRow = {
      email,
      customer_name: name,
      items,
      subtotal,
      discount,
      total,
      currency: 'usd',
      status: 'paid' as const,
      stripe_session_id: session.id,
      print_partner_id: partner?.id ?? null,
      city,
      postal_code,
    };

    let orderId = '';
    if (sb) {
      try {
        // Idempotency: skip if we already recorded this session.
        const { data: existing } = await sb
          .from('orders')
          .select('id')
          .eq('stripe_session_id', session.id)
          .maybeSingle();
        if (!existing) {
          const { data: inserted, error } = await sb
            .from('orders')
            .insert(orderRow)
            .select('id')
            .single();
          if (error) throw error;
          orderId = inserted.id as string;
        } else {
          orderId = existing.id as string;
        }

        // Upsert customer by email.
        await sb
          .from('customers')
          .upsert(
            { email, name, city, postal_code },
            { onConflict: 'email' },
          );
      } catch (err) {
        console.error('[webhook] supabase write failed', err);
      }
    } else {
      console.log(
        '[webhook] Supabase not configured — order logged only',
        JSON.stringify({ ...orderRow, items: items.length }),
      );
      orderId = `offline-${session.id}`;
    }

    const orderLike = {
      ...orderRow,
      id: orderId,
    } as Pick<
      OrderRecord,
      | 'id'
      | 'email'
      | 'customer_name'
      | 'items'
      | 'subtotal'
      | 'discount'
      | 'total'
      | 'city'
      | 'postal_code'
    >;

    // Customer confirmation.
    if (email) {
      await sendEmail(
        email,
        `Your PrintMate AI order is confirmed (#${orderId})`,
        orderEmailHtml(orderLike, partner?.name ?? null),
      );
    }

    // Print-partner fulfillment + mark sent_to_printer.
    if (partner && sb) {
      const sent = await sendEmail(
        partner.email,
        `New print job — order #${orderId}`,
        partnerEmailHtml(orderLike, partner),
      );
      if (sent) {
        try {
          await sb
            .from('orders')
            .update({ status: 'sent_to_printer' })
            .eq('id', orderId);
        } catch (err) {
          console.error('[webhook] status update failed', err);
        }
      }
    } else if (partner) {
      await sendEmail(
        partner.email,
        `New print job — order #${orderId}`,
        partnerEmailHtml(orderLike, partner),
      );
    }
  }

  return NextResponse.json({ received: true });
}
