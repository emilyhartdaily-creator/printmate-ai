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

function requireAuth(
  req: NextRequest,
  resource: AdminResource | null,
): { error: NextResponse } | { sb: NonNullable<ReturnType<typeof getSupabase>> } {
  if (!resource) {
    return { error: NextResponse.json({ error: 'Unknown resource' }, { status: 404 }) };
  }
  if (!isAdminAuthed(req)) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const sb = getSupabase();
  if (!sb) {
    return {
      error: NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 },
      ),
    };
  }
  return { sb };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { resource: string; id: string } },
) {
  const resource = resourceOf(params);
  const gate = requireAuth(req, resource);
  if ('error' in gate) return gate.error;

  const { data, error } = await gate.sb
    .from(resource!)
    .select('*')
    .eq('id', params.id)
    .maybeSingle();
  if (error) {
    console.error(`[admin GET ${resource}/${params.id}]`, error);
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ row: data });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { resource: string; id: string } },
) {
  const resource = resourceOf(params);
  const gate = requireAuth(req, resource);
  if ('error' in gate) return gate.error;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  delete body.id;

  const { data, error } = await gate.sb
    .from(resource!)
    .update(body)
    .eq('id', params.id)
    .select()
    .maybeSingle();
  if (error) {
    console.error(`[admin PUT ${resource}/${params.id}]`, error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ row: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { resource: string; id: string } },
) {
  const resource = resourceOf(params);
  const gate = requireAuth(req, resource);
  if ('error' in gate) return gate.error;

  const { error, count } = await gate.sb
    .from(resource!)
    .delete({ count: 'exact' })
    .eq('id', params.id);
  if (error) {
    console.error(`[admin DELETE ${resource}/${params.id}]`, error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
  if (count === 0)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
