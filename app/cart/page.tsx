'use client';

import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/lib/cart';
import { formatPrice } from '@/lib/format';

export default function CartPage() {
  const { items, subtotal, updateQty, removeItem } = useCart();

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="section-title">
          Your <span className="gradient-text">cart</span>
        </h1>

        {items.length === 0 ? (
          <div className="card mt-8 text-center">
            <p className="font-display text-xl font-bold">Your cart is empty</p>
            <p className="mt-2 text-sm text-muted">
              Start with a design in the Studio, or browse the shop for ideas.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/studio" className="btn-primary">
                Start Designing
              </Link>
              <Link href="/shop" className="btn-secondary">
                Browse Shop
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              {items.map((item) => (
                <div
                  key={item.key}
                  className="card flex flex-col gap-4 !p-4 sm:flex-row"
                >
                  <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-line bg-surface">
                    <Image
                      src={item.design_url ?? item.image_url}
                      alt={item.name}
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display font-bold text-zinc-100">
                          {item.name}
                        </h3>
                        <p className="mt-1 text-xs text-muted">
                          {item.size} · {item.color}
                          {item.design_url ? ' · Custom design' : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        className="text-xs font-bold text-muted transition hover:text-red-400"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center rounded-xl border border-line bg-surface">
                        <button
                          type="button"
                          className="px-3 py-1.5 font-bold text-zinc-300 transition hover:text-white"
                          onClick={() => updateQty(item.key, item.qty - 1)}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-bold" aria-live="polite">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          className="px-3 py-1.5 font-bold text-zinc-300 transition hover:text-white"
                          onClick={() => updateQty(item.key, item.qty + 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <p className="font-extrabold text-white">
                        {formatPrice(item.base_price * item.qty)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="card h-fit lg:sticky lg:top-24">
              <h2 className="font-display text-lg font-bold">Order summary</h2>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between text-muted">
                  <span>Items</span>
                  <span>{items.reduce((n, i) => n + i.qty, 0)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="flex justify-between border-t border-line pt-3 text-base font-extrabold text-white">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
              </div>
              <Link href="/checkout" className="btn-primary mt-6 w-full">
                Proceed to Checkout
              </Link>
              <Link href="/shop" className="btn-secondary mt-3 w-full">
                Continue shopping
              </Link>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
