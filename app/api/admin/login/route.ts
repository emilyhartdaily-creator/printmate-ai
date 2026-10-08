import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { buildAuthCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const password =
    typeof (body as { password?: unknown }).password === 'string'
      ? ((body as { password: string }).password ?? '')
      : '';

  const expected = process.env.ADMIN_PASSWORD;
  const ok =
    !!expected &&
    password.length > 0 &&
    (() => {
      const a = Buffer.from(password);
      const b = Buffer.from(expected);
      return a.length === b.length && timingSafeEqual(a, b);
    })();

  if (!ok) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.headers.set('Set-Cookie', buildAuthCookie());
  return res;
}
