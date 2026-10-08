import Link from 'next/link';
import { CATEGORY_LABELS, COLLECTION_META, type CollectionSlug } from '@/lib/types';

const CATEGORY_SLUGS = Object.keys(CATEGORY_LABELS) as (keyof typeof CATEGORY_LABELS)[];
const COLLECTION_SLUGS = Object.keys(COLLECTION_META) as CollectionSlug[];

export default function Footer() {
  return (
    <footer className="border-t border-line/60 bg-surface/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <p className="font-display text-lg font-extrabold tracking-tight">
            PrintMate <span className="gradient-text">AI</span>
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Custom print-on-demand, designed by you. Every order is routed to
            the nearest local print partner.
          </p>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">Shop</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/shop" className="text-zinc-300 transition hover:text-white">
                All products
              </Link>
            </li>
            {CATEGORY_SLUGS.map((c) => (
              <li key={c}>
                <Link
                  href={`/shop?category=${c}`}
                  className="text-zinc-300 transition hover:text-white"
                >
                  {CATEGORY_LABELS[c]}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">Collections</p>
          <ul className="space-y-2 text-sm">
            {COLLECTION_SLUGS.map((slug) => (
              <li key={slug}>
                <Link
                  href={`/collections/${slug}`}
                  className="text-zinc-300 transition hover:text-white"
                >
                  {COLLECTION_META[slug].title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">Company</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/studio" className="text-zinc-300 transition hover:text-white">
                AI Design Studio
              </Link>
            </li>
            <li>
              <Link href="/cart" className="text-zinc-300 transition hover:text-white">
                Cart
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted sm:flex-row sm:px-6">
          <p>© 2026 PrintMate AI. All rights reserved.</p>
          <p className="rounded-full border border-line bg-ink px-3 py-1">
            Demo storefront — payments in Stripe test mode
          </p>
        </div>
      </div>
    </footer>
  );
}
