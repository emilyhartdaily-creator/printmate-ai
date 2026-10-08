import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthed } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import { ADMIN_RESOURCES, type AdminResource } from '@/lib/types';

function resourceOf(params: { resource?: string }): AdminResource | null {
  const r = params.resource ?? '';
  return (ADMIN_RESOURCES as readonly string[]).includes(r)
    ? (r as AdminResource)
    : null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { resource: string } },
) {
  const resource = resourceOf(params);
  if (!resource) return NextResponse.json({ error: 'Unknown resource' }, { status: 404 });
  if (!isAdminAuthed(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = getSupabase();
  if (!sb)
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 },
    );

  const { data, error } = await sb.from(resource).select('*');
  if (error) {
    console.error(`[admin GET ${resource}]`, error);
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }
  return NextResponse.json({ rows: data ?? [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { resource: string } },
) {
  const resource = resourceOf(params);
  if (!resource) return NextResponse.json({ error: 'Unknown resource' }, { status: 404 });
  if (!isAdminAuthed(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = getSupabase();
  if (!sb)
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 },
    );

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { data, error } = await sb.from(resource).insert(body).select().single();
  if (error) {
    console.error(`[admin POST ${resource}]`, error);
    return NextResponse.json({ error: 'Insert failed' }, { status: 500 });
  }
  return NextResponse.json({ row: data }, { status: 201 });
}
