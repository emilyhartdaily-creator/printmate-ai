'use client';

import { useMemo, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/lib/cart';
import { formatPrice } from '@/lib/format';

/** Display-only fallback promos; the server re-validates everything. */
const FALLBACK_PROMOS: Record<string, number> = {
  WELCOME10: 10,
  STUDIO15: 15,
};

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const promoPercent = useMemo(() => {
    const code = promoCode.trim().toUpperCase();
    return code ? (FALLBACK_PROMOS[code] ?? null) : null;
  }, [promoCode]);

  const discount = promoPercent ? Math.round((subtotal * promoPercent) / 100) : 0;
  const total = subtotal - discount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (items.length === 0) {
      setError('Your cart is empty.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          email: email.trim(),
          name: name.trim(),
          city: city.trim(),
          postal_code: postalCode.trim(),
          promoCode: promoCode.trim(),
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Checkout failed');
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="section-title font-display">
          <span className="gradient-text">Checkout</span>
        </h1>

        {items.length === 0 ? (
          <div className="card mt-8 text-center">
            <p className="text-muted">Your cart is empty.</p>
            <a href="/" className="btn-primary mt-4 inline-flex">
              Back to shop
            </a>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 md:grid-cols-[1fr_360px]">
            <form onSubmit={handleSubmit} className="card space-y-5">
              <div className="flex items-center gap-3">
                <span className="badge">Test mode — no real charge</span>
              </div>

              <div>
                <label className="label" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  className="input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="label" htmlFor="name">Full name</label>
                <input
                  id="name"
                  className="input"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="city">City</label>
                  <input
                    id="city"
                    className="input"
                    placeholder="Lahore"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="postal">Postal code</label>
                  <input
                    id="postal"
                    className="input"
                    placeholder="54000"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="promo">
                  Promo code <span className="font-normal text-muted">(optional)</span>
                </label>
                <input
                  id="promo"
                  className="input uppercase"
                  placeholder="WELCOME10"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                />
                {promoCode.trim() && promoPercent === null && (
                  <p className="mt-1.5 text-sm text-amber-400">
                    This code is not in our known list — we&apos;ll verify it at checkout.
                  </p>
                )}
              </div>

              {error && (
                <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </p>
              )}

              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? 'Redirecting to Stripe…' : `Pay ${formatPrice(total)}`}
              </button>
              <button
                type="button"
                className="btn-secondary w-full"
                onClick={() => {
                  if (confirm('Clear your cart?')) clear();
                }}
              >
                Clear cart
              </button>
            </form>

            <aside className="card h-fit space-y-4">
              <h2 className="font-display text-lg font-bold">Order summary</h2>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.key} className="flex gap-3">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                    <div className="flex-1 text-sm">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-muted">
                        {item.size} · {item.color} · ×{item.qty}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">
                      {formatPrice(item.base_price * item.qty)}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="space-y-1.5 border-t border-line pt-4 text-sm">
                <div className="flex justify-between text-muted">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Promo ({promoCode.trim().toUpperCase()})</span>
                    <span>−{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
