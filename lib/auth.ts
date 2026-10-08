import { createHash, timingSafeEqual } from 'crypto';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'pm_admin';
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

function deriveToken(): Buffer | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return createHash('sha256')
    .update(password + '|printmate-admin')
    .digest();
}

/** True when the request carries a valid admin session cookie. */
export function isAdminAuthed(req: NextRequest): boolean {
  const expected = deriveToken();
  if (!expected) return false;
  const provided = req.cookies.get(COOKIE_NAME)?.value;
  if (!provided) return false;
  try {
    const providedBuf = Buffer.from(provided, 'hex');
    return (
      providedBuf.length === expected.length &&
      timingSafeEqual(providedBuf, expected)
    );
  } catch {
    return false;
  }
}

/** Builds the Set-Cookie header value for a fresh admin session. */
export function buildAuthCookie(): string {
  const token = deriveToken()?.toString('hex') ?? '';
  const parts = [
    `${COOKIE_NAME}=${token}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${COOKIE_MAX_AGE}`,
  ];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  if (appUrl.startsWith('https')) parts.push('Secure');
  return parts.join('; ');
}

/** Builds the Set-Cookie header value that clears the admin session. */
export function buildLogoutCookie(): string {
  const parts = [
    `${COOKIE_NAME}=`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    'Max-Age=0',
  ];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  if (appUrl.startsWith('https')) parts.push('Secure');
  return parts.join('; ');
}
