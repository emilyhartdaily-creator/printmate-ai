import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthed } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';

const BUCKET = 'product-images';
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export async function POST(req: NextRequest) {
  if (!isAdminAuthed(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const sb = getSupabase();
  if (!sb)
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 },
    );

  let file: File | null = null;
  try {
    const form = await req.formData();
    const v = form.get('file');
    if (v instanceof File) file = v;
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }
  if (!file)
    return NextResponse.json({ error: 'file is required' }, { status: 400 });
  if (!ALLOWED.has(file.type))
    return NextResponse.json(
      { error: 'Only JPG, PNG, WebP or GIF images are allowed' },
      { status: 400 },
    );
  if (file.size > MAX_BYTES)
    return NextResponse.json(
      { error: 'Image must be 5 MB or smaller' },
      { status: 400 },
    );

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await sb.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) {
    console.error('[admin upload]', error);
    return NextResponse.json(
      { error: 'Upload failed — is the product-images storage bucket created?' },
      { status: 500 },
    );
  }

  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, path }, { status: 201 });
}
