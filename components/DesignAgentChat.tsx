'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useCart } from '@/lib/cart';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/lib/types';

type ChatRole = 'user' | 'assistant';

interface ChatMessage {
  id: number;
  role: ChatRole;
  content: string;
  imageUrl?: string;
  pendingImage?: boolean;
}

interface ChatApiResponse {
  reply?: string;
  designPrompt?: string | null;
  error?: string;
}

interface StudioApiResponse {
  imageUrl?: string;
  image_url?: string;
  error?: string;
}

const STARTERS = [
  'A mug for my dad who loves fishing',
  'Funny cat t-shirt',
  'Minimal mountain mug',
] as const;

const CHAT_ERROR =
  'Hmm, something hiccuped on my end. Want to try that again?';
const IMAGE_ERROR =
  'I had trouble creating that image. Try describing it a little differently?';

export default function DesignAgentChat({ products }: { products: Product[] }) {
  const { addItem } = useCart();
  const idRef = useRef(1);
  const listRef = useRef<HTMLDivElement>(null);
  const lastUserTextRef = useRef<string | null>(null);
  const lastFailedStepRef = useRef<'chat' | 'image' | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Product step
  const [designUrl, setDesignUrl] = useState<string | null>(null);
  const [productId, setProductId] = useState<string>(products[0]?.id ?? '');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [added, setAdded] = useState(false);

  const busy = chatLoading || imageLoading;
  const chosen = products.find((p) => p.id === productId) ?? products[0];

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, chatLoading, imageLoading]);

  const appendMessage = (m: Omit<ChatMessage, 'id'>) =>
    setMessages((prev) => [...prev, { ...m, id: idRef.current++ }]);

  const generateImage = async (designPrompt: string) => {
    setImageLoading(true);
    setError(null);
    lastFailedStepRef.current = null;
    appendMessage({
      role: 'assistant',
      content: 'Creating your design…',
      pendingImage: true,
    });
    try {
      const res = await fetch('/api/studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: designPrompt }),
      });
      const data = (await res.json()) as StudioApiResponse;
      if (!res.ok) {
        throw new Error(data.error ?? `Image generation failed (${res.status})`);
      }
      const url = data.imageUrl ?? data.image_url ?? null;
      if (!url) throw new Error('The studio returned no image.');
      setDesignUrl(url);
      setMessages((prev) =>
        prev.map((m) =>
          m.pendingImage
            ? {
                ...m,
                pendingImage: false,
                imageUrl: url,
                content: 'Here is your design! Like it? Pick a product below to print it on.',
              }
            : m,
        ),
      );
    } catch {
      setMessages((prev) => prev.filter((m) => !m.pendingImage));
      lastFailedStepRef.current = 'image';
      lastUserTextRef.current = designPrompt;
      setError(IMAGE_ERROR);
    } finally {
      setImageLoading(false);
    }
  };

  const runChatTurn = async (history: { role: ChatRole; content: string }[]) => {
    setChatLoading(true);
    setError(null);
    lastFailedStepRef.current = null;
    try {
      const res = await fetch('/api/studio/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      const data = (await res.json()) as ChatApiResponse;
      if (!res.ok) {
        throw new Error(data.error ?? `Chat failed (${res.status})`);
      }
      if (data.reply) {
        appendMessage({ role: 'assistant', content: data.reply });
      }
      if (data.designPrompt) {
        await generateImage(data.designPrompt);
      }
    } catch {
      lastFailedStepRef.current = 'chat';
      setError(CHAT_ERROR);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSend = async (text: string, skipAppend = false) => {
    const clean = text.trim();
    if (!clean || busy) return;
    setError(null);
    setAdded(false);
    const history = messages
      .filter((m) => !m.pendingImage && m.content.trim().length > 0)
      .map((m) => ({ role: m.role, content: m.content }));
    if (!skipAppend) {
      appendMessage({ role: 'user', content: clean });
      lastUserTextRef.current = clean;
      history.push({ role: 'user', content: clean });
    }
    await runChatTurn(history);
  };

  const handleRetry = () => {
    if (busy) return;
    const step = lastFailedStepRef.current;
    const text = lastUserTextRef.current;
    if (!step || !text) return;
    if (step === 'image') {
      void generateImage(text);
    } else {
      const history = messages
        .filter((m) => !m.pendingImage && m.content.trim().length > 0)
        .map((m) => ({ role: m.role, content: m.content }));
      void runChatTurn(history);
    }
  };

  const addDesignToCart = () => {
    if (!chosen || !designUrl) return;
    addItem({
      product_id: chosen.id,
      name: chosen.name,
      base_price: chosen.base_price,
      image_url: chosen.image_url,
      size: size || chosen.sizes[0] || 'One size',
      color: color || chosen.colors[0] || 'Default',
      design_url: designUrl,
      qty: 1,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 4000);
  };

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-2">
      {/* Chat */}
      <div className="card">
        <p className="font-display text-lg font-bold">
          <span className="gradient-text">Chat</span> with the designer
        </p>
        <p className="mt-1 text-sm text-muted">
          Tell me what you want — I&apos;ll ask a couple of quick questions, then
          create your design.
        </p>

        <div
          ref={listRef}
          className="mt-5 max-h-[52vh] min-h-64 space-y-3 overflow-y-auto rounded-xl border border-line bg-paper p-4"
          aria-live="polite"
        >
          {messages.length === 0 && !chatLoading ? (
            <>
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-line bg-surface px-4 py-3 text-sm text-ink">
                  👋 Hi! I&apos;m your PrintMate design assistant. Tell me what
                  you&apos;d like on a t-shirt or mug — a gift idea, a vibe,
                  anything.
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="chip"
                    onClick={() => void handleSend(s)}
                    disabled={busy}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-3 text-sm ${
                    m.role === 'user'
                      ? 'rounded-2xl rounded-tr-md bg-brand-600 text-white'
                      : 'rounded-2xl rounded-tl-md border border-line bg-surface text-ink'
                  }`}
                >
                  {m.pendingImage ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500/40 border-t-brand-600" />
                      {m.content}
                    </span>
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}
                  {m.imageUrl && (
                    <img
                      src={m.imageUrl}
                      alt="AI-generated design"
                      className="mt-2 w-full rounded-lg object-contain"
                    />
                  )}
                </div>
              </div>
            ))
          )}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-line bg-surface px-4 py-3">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-2 w-2 animate-bounce rounded-full bg-muted"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-4">
            <p className="text-sm text-red-300">{error}</p>
            <button
              type="button"
              className="btn-secondary shrink-0 !px-4 !py-2 text-sm"
              onClick={handleRetry}
              disabled={busy}
            >
              Try again
            </button>
          </div>
        )}

        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSend(input);
            setInput('');
          }}
        >
          <input
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your design…"
            maxLength={1000}
            disabled={busy}
            aria-label="Message the design assistant"
          />
          <button
            type="submit"
            className="btn-primary shrink-0 !px-5"
            disabled={busy || input.trim().length === 0}
          >
            Send
          </button>
        </form>
      </div>

      {/* Put it on a product */}
      <div className="card">
        <p className="font-display text-lg font-bold">
          <span className="gradient-text">Put it</span> on a product
        </p>

        {!designUrl ? (
          <div className="mt-6 rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">
            Chat with the designer first — once your design is ready, pick a
            product to print it on.
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            <div className="overflow-hidden rounded-xl border border-line">
              <img
                src={designUrl}
                alt="Your AI-generated design"
                className="w-full object-contain"
              />
            </div>

            <div>
              <label className="label" htmlFor="chat-product">
                Product
              </label>
              <select
                id="chat-product"
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
                    <p className="text-sm font-bold text-green-300">
                      ✓ Added to cart
                    </p>
                    <Link href="/cart" className="btn-secondary !px-4 !py-2 text-sm">
                      View Cart
                    </Link>
                  </div>
                )}

                <Link
                  href={`/product/${chosen.id}?design=${encodeURIComponent(designUrl)}`}
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
  );
}
