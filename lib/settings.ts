import { getSupabase } from './supabase';

export const PLATFORM_FEE_KEY = 'platform_fee_percent';
export const DEFAULT_PLATFORM_FEE = 30;
export const MAX_PLATFORM_FEE = 90;

/** Your platform fee percent (your cut of each order). Printers get the rest. */
export async function getPlatformFeePercent(): Promise<number> {
  const sb = getSupabase();
  if (!sb) return DEFAULT_PLATFORM_FEE;
  try {
    const { data } = await sb
      .from('platform_settings')
      .select('value')
      .eq('key', PLATFORM_FEE_KEY)
      .maybeSingle();
    const n = Number((data as { value?: string } | null)?.value);
    return Number.isFinite(n) && n >= 0 && n <= MAX_PLATFORM_FEE
      ? n
      : DEFAULT_PLATFORM_FEE;
  } catch {
    return DEFAULT_PLATFORM_FEE;
  }
}
