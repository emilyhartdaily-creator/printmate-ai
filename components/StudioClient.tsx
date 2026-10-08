'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useCart } from '@/lib/cart';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/lib/types';
import DesignAgentChat from './DesignAgentChat';

const STYLE_CHIPS = [
  'retro',
  'minimal',
  'kawaii',
  'vintage',
  'cyberpunk',
  'watercolor',
  'line-art',
  'bold typography',
] as const;

interface StudioResponse {
  imageUrl?: string;
  image_url?: string;
  error?: string;
}

function resolveImageUrl(data: StudioResponse): string | null {
  return data.imageUrl ?? data.image_url ?? null;
}

export default function StudioClient({ products }: { products: Product[] }) {
  const { addItem } = useCart();

  // Chat vs. manual form mode
  const [mode, setMode] = useState<'chat' | 'form'>('chat');

  // Step 1: design generation
  const [prompt, setPrompt] = useState('');
  const [styles, setStyles] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Step 2: product assignment
  const [productId, setProductId] = useState<string>(products[0]?.id ?? '');
  const chosen = useMemo(
    () => products.find((p) => p.id === productId) ?? products[0],
    [products, productId],
  );
  const [size, setSize] = useState<string>('');
  const [color, setColor] = useState<string>('');
  const [added, setAdded] = useState(false);

  const toggleStyle = (s: string) =>
    setStyles((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const fullPrompt = useMemo(() => {
    const base = prompt.trim();
    return styles.length > 0 && base.length > 0
      ? `${base}, ${styles.join(', ')} style`
      : base;
  }, [prompt, styles]);

  const generate = async () => {
    if (fullPrompt.length === 0 || generating) return;
    setGenerating(true);
    setError(null);
    setAdded(false);
    try {
      const res = await fetch('/api/studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fullPrompt }),
      });
      const data = (await res.json()) as StudioResponse;
      if (!res.ok) {
        throw new Error(data.error ?? `Generation failed (${res.status})`);
      }
      const url = resolveImageUrl(data);
      if (!url) throw new Error('The studio returned no image. Try again.');
      setImageUrl(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong generating your design.');
    } finally {
      setGenerating(false);
    }
  };

  const addDesignToCart = () => {
    if (!chosen || !imageUrl) return;
    addItem({
      product_id: chosen.id,
      name: chosen.name,
      base_price: chosen.base_price,
      image_url: chosen.image_url,
      size: size || chosen.sizes[0] || 'One size',
      color: color || chosen.colors[0] || 'Default',
      design_url: imageUrl,
      qty: 1,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 4000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="section-title">
        AI Design <span className="gradient-text">Studio</span>
      </h1>
      <p className="mt-2 text-muted">
        Describe your design, generate it with AI, then put it on any product.
      </p>

      <div
        className="mt-6 inline-flex rounded-xl border border-line bg-surface p-1"
        role="tablist"
        aria-label="Studio mode"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'chat'}
          onClick={() => setMode('chat')}
          className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
            mode === 'chat'
              ? 'bg-brand-600 text-white'
              : 'text-muted hover:text-zinc-100'
          }`}
        >
          💬 Chat with the designer
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'form'}
          onClick={() => setMode('form')}
          className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
            mode === 'form'
              ? 'bg-brand-600 text-white'
              : 'text-muted hover:text-zinc-100'
          }`}
        >
          ✍️ Write it yourself
        </button>
      </div>

      {mode === 'chat' ? (
        <DesignAgentChat products={products} />
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Step 1 */}
        <div className="card">
          <p className="font-display text-lg font-bold">
            <span className="gradient-text">Step 1</span> — Create your design
          </p>
          <label className="label mt-5" htmlFor="studio-prompt">
            Describe what you want
          </label>
          <textarea
            id="studio-prompt"
            className="input min-h-28"
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A happy astronaut cat floating among stars…"
          />
          <p className="label mt-4">Style (optional)</p>
          <div className="flex flex-wrap gap-2">
            {STYLE_CHIPS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleStyle(s)}
                className={`chip ${styles.includes(s) ? 'chip-active' : ''}`}
                aria-pressed={styles.includes(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn-primary mt-6 w-full"
            onClick={generate}
            disabled={generating || fullPrompt.trim().length === 0}
          >
            {generating ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Generating…
              </>
            ) : (
              'Generate design'
            )}
          </button>

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {imageUrl && (
            <div className="mt-6">
              <p className="label">Your design</p>
              <div className="overflow-hidden rounded-xl border border-line">
                <img src={imageUrl} alt="AI-generated design" className="w-full object-contain" />
              </div>
            </div>
          )}
        </div>

        {/* Step 2 */}
        <div className="card">
          <p className="font-display text-lg font-bold">
            <span className="gradient-text">Step 2</span> — Put it on a product
          </p>

          {!imageUrl ? (
            <div className="mt-6 rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">
              Generate a design first — then choose a product to print it on.
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              <div>
                <label className="label" htmlFor="studio-product">
                  Product
                </label>
                <select
                  id="studio-product"
                  className="input"
                  value={productId}
                  onChange={(e) => {
                    setProductId(e.target.value);
                    setSize('');
                    setColor('');
                    setAdded(false);
                  }}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatPrice(p.base_price)}
                    </option>
                  ))}
                </select>
              </div>

              {chosen && (
                <>
                  <div>
                    <span className="label">Size</span>
                    <div className="flex flex-wrap gap-2">
                      {chosen.sizes.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSize(s)}
                          className={`chip ${(size || chosen.sizes[0]) === s ? 'chip-active' : ''}`}
                          aria-pressed={(size || chosen.sizes[0]) === s}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="label">Color</span>
                    <div className="flex flex-wrap gap-2">
                      {chosen.colors.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColor(c)}
                          className={`chip ${(color || chosen.colors[0]) === c ? 'chip-active' : ''}`}
                          aria-pressed={(color || chosen.colors[0]) === c}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-primary w-full"
                    onClick={addDesignToCart}
                  >
                    Add to cart with design
                  </button>

                  {added && (
                    <div className="flex items-center justify-between rounded-xl border border-green-500/40 bg-green-500/10 p-4">
                      <p className="text-sm font-bold text-green-300">✓ Added to cart</p>
                      <Link href="/cart" className="btn-secondary !px-4 !py-2 text-sm">
                        View Cart
                      </Link>
                    </div>
                  )}

                  <Link
                    href={`/product/${chosen.id}?design=${encodeURIComponent(imageUrl)}`}
                    className="btn-secondary w-full"
                  >
                    Preview on product
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
        </div>
      )}
    </div>
  );
}
