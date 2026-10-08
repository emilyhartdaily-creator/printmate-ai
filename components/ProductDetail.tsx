'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/lib/cart';
import { formatPrice } from '@/lib/format';
import { categoryLabel, type Product } from '@/lib/types';

export default function ProductDetail({
  product,
  initialDesign,
}: {
  product: Product;
  initialDesign?: string;
}) {
  const { addItem } = useCart();
  const [size, setSize] = useState<string>(product.sizes[0] ?? 'One size');
  const [color, setColor] = useState<string>(product.colors[0] ?? 'Default');
  const [qty, setQty] = useState(1);
  const [designUrl, setDesignUrl] = useState<string | undefined>(
    initialDesign && initialDesign.length > 0 ? initialDesign : undefined,
  );
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem({
      product_id: product.id,
      name: product.name,
      base_price: product.base_price,
      image_url: product.image_url,
      size,
      color,
      design_url: designUrl,
      qty,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 4000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Product image with live design preview overlay */}
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-line bg-surface">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority
          />
          {designUrl && (
            <img
              src={designUrl}
              alt="Your design preview"
              className="absolute left-1/2 top-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg opacity-90 mix-blend-normal shadow-lg"
            />
          )}
          <span className="badge absolute left-4 top-4 !bg-ink/70 backdrop-blur">
            {categoryLabel(product.category)}
          </span>
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            {product.name}
          </h1>
          <p className="mt-2 text-2xl font-extrabold text-ink">
            {formatPrice(product.base_price)}
          </p>
          <p className="mt-4 leading-relaxed text-muted">{product.description}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {product.tags.map((t) => (
              <span key={t} className="badge">
                {t}
              </span>
            ))}
          </div>

          {/* Design preview controls */}
          {designUrl ? (
            <div className="card mt-6 flex items-center gap-4 !p-4">
              <img
                src={designUrl}
                alt="Your design"
                className="h-16 w-16 rounded-lg border border-line object-cover"
              />
              <div className="flex-1">
                <p className="text-sm font-bold text-ink">Design applied</p>
                <p className="text-xs text-muted">Previewing live on this product.</p>
              </div>
              <button
                type="button"
                className="btn-secondary !px-4 !py-2 text-sm"
                onClick={() => setDesignUrl(undefined)}
              >
                Remove
              </button>
            </div>
          ) : (
            <Link href="/studio" className="btn-secondary mt-6 w-fit">
              Design it in the Studio
            </Link>
          )}

          {/* Size */}
          <div className="mt-6">
            <span className="label">Size</span>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={`chip ${size === s ? 'chip-active' : ''}`}
                  aria-pressed={size === s}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="mt-5">
            <span className="label">Color</span>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`chip ${color === c ? 'chip-active' : ''}`}
                  aria-pressed={color === c}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Qty + Add to cart */}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="flex items-center rounded-xl border border-line bg-surface">
              <button
                type="button"
                className="px-4 py-3 text-lg font-bold text-muted transition hover:text-ink"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-10 text-center font-bold" aria-live="polite">
                {qty}
              </span>
              <button
                type="button"
                className="px-4 py-3 text-lg font-bold text-muted transition hover:text-ink"
                onClick={() => setQty((q) => Math.min(99, q + 1))}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <button type="button" className="btn-primary flex-1" onClick={handleAdd}>
              Add to Cart — {formatPrice(product.base_price * qty)}
            </button>
          </div>

          {added && (
            <div className="card mt-4 flex items-center justify-between !p-4 !border-green-500/40">
              <p className="text-sm font-bold text-green-300">
                ✓ Added to cart
              </p>
              <Link href="/cart" className="btn-secondary !px-4 !py-2 text-sm">
                View Cart
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
