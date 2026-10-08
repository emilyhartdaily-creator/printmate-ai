import Stripe from 'stripe';

let stripe: Stripe | null = null;
let attempted = false;

/**
 * Lazily-initialized Stripe client. Returns null when STRIPE_SECRET_KEY
 * is missing so the app can degrade gracefully instead of crashing.
 */
export function getStripe(): Stripe | null {
  if (attempted) return stripe;
  attempted = true;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  stripe = new Stripe(key, { apiVersion: '2024-06-20' });
  return stripe;
}
