import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthed } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import {
  PLATFORM_FEE_KEY,
  MAX_PLATFORM_FEE,
  getPlatformFeePercent,
} from '@/lib/settings';

export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const sb = getSupabase();
  if (!sb)
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 },
    );
  return NextResponse.json({ platform_fee_percent: await getPlatformFeePercent() });
}

export async function PUT(req: NextRequest) {
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
  const fee = Number((body as { platform_fee_percent?: unknown }).platform_fee_percent);
  if (!Number.isFinite(fee) || fee < 0 || fee > MAX_PLATFORM_FEE) {
    return NextResponse.json(
      { error: `platform_fee_percent must be between 0 and ${MAX_PLATFORM_FEE}` },
      { status: 400 },
    );
  }
  const { error } = await sb
    .from('platform_settings')
    .upsert({ key: PLATFORM_FEE_KEY, value: String(fee) }, { onConflict: 'key' });
  if (error) {
    console.error('[admin settings PUT]', error);
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }
  return NextResponse.json({ platform_fee_percent: fee });
}
