import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthed } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import { getPlatformFeePercent } from '@/lib/settings';
import type { OrderRecord, PrintPartner } from '@/lib/types';

export interface PayoutRow {
  order_id: string;
  created_at: string;
  partner_id: string | null;
  partner_name: string | null;
  partner_email: string | null;
  /** cents, what the customer paid */
  total: number;
  /** cents, printer's share */
  printer_share: number;
  /** cents, platform's share */
  platform_share: number;
  payout_status: 'unpaid' | 'paid' | 'na';
}

const PAYABLE_STATUSES = ['paid', 'sent_to_printer', 'shipped', 'delivered'];

export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const sb = getSupabase();
  if (!sb)
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 },
    );

  const fee = await getPlatformFeePercent();

  const { data: orders, error } = await sb
    .from('orders')
    .select('*')
    .in('status', PAYABLE_STATUSES)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[admin payouts GET orders]', error);
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }

  const { data: partners } = await sb.from('print_partners').select('*');
  const partnerById = new Map<string, PrintPartner>();
  for (const p of (partners ?? []) as PrintPartner[]) partnerById.set(p.id, p);

  const rows: PayoutRow[] = ((orders ?? []) as OrderRecord[]).map((o) => {
    const total = Number(o.total) || 0;
    const partner = o.print_partner_id
      ? partnerById.get(o.print_partner_id) ?? null
      : null;
    const printer_share = partner
      ? Math.round((total * (100 - fee)) / 100)
      : 0;
    const payout_status = !partner
      ? 'na'
      : (o as OrderRecord & { payout_status?: string }).payout_status === 'paid'
        ? 'paid'
        : 'unpaid';
    return {
      order_id: o.id,
      created_at: o.created_at,
      partner_id: partner?.id ?? null,
      partner_name: partner?.name ?? null,
      partner_email: partner?.email ?? null,
      total,
      printer_share,
      platform_share: total - printer_share,
      payout_status,
    };
  });

  const totals = rows.reduce(
    (s, r) => ({
      printer: s.printer + (r.payout_status === 'unpaid' ? r.printer_share : 0),
      platform: s.platform + r.platform_share,
      paid: s.paid + (r.payout_status === 'paid' ? r.printer_share : 0),
    }),
    { printer: 0, platform: 0, paid: 0 },
  );

  return NextResponse.json({
    platform_fee_percent: fee,
    rows,
    totals,
  });
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthed(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const sb = getSupabase();
  if (!sb)
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 },
    );
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const order_id = String(
    (body as { order_id?: unknown }).order_id ?? '',
  ).trim();
  if (!order_id)
    return NextResponse.json({ error: 'order_id is required' }, { status: 400 });

  const { error } = await sb
    .from('orders')
    .update({ payout_status: 'paid' })
    .eq('id', order_id);
  if (error) {
    console.error('[admin payouts POST]', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, order_id });
}
