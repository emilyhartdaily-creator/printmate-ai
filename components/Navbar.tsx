'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useCart } from '@/lib/cart';
import { COLLECTION_META, type CollectionSlug } from '@/lib/types';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/studio', label: 'Studio' },
] as const;

const COLLECTION_SLUGS = Object.keys(COLLECTION_META) as CollectionSlug[];

export default function Navbar() {
  const pathname = usePathname();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const closeMobile = () => {
    setOpen(false);
    setCollectionsOpen(false);
  };

  const linkCls = (href: string) =>
    `rounded-lg px-3 py-2 text-sm font-semibold transition ${
      isActive(href)
        ? 'text-white bg-brand-500/20'
        : 'text-zinc-300 hover:text-white hover:bg-white/5'
    }`;

  return (
    <>
      <div className="bg-gradient-to-r from-brand-600 via-brand-500 to-coral-500 px-4 py-2 text-center text-xs font-bold uppercase tracking-wider text-white">
        Free US shipping on orders over $50&nbsp;&nbsp;·&nbsp;&nbsp;Printed in the USA
      </div>
    <header className="sticky top-0 z-40 border-b border-line/60 bg-ink/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2" onClick={closeMobile}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-coral-500 font-display text-lg font-extrabold text-white">
            P
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight">
            PrintMate <span className="gradient-text">AI</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={linkCls(l.href)}>
              {l.label}
            </Link>
          ))}
          <div className="relative">
            <button
              type="button"
              className={`${linkCls('/collections')} inline-flex items-center gap-1`}
              onClick={() => setCollectionsOpen((v) => !v)}
              aria-expanded={collectionsOpen}
              aria-haspopup="true"
            >
              Collections
              <svg
                className={`h-3.5 w-3.5 transition-transform ${collectionsOpen ? 'rotate-180' : ''}`}
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            {collectionsOpen && (
              <div
                className="absolute left-0 mt-2 w-64 overflow-hidden rounded-xl border border-line bg-card shadow-2xl shadow-black/40"
                onMouseLeave={() => setCollectionsOpen(false)}
              >
                {COLLECTION_SLUGS.map((slug) => (
                  <Link
                    key={slug}
                    href={`/collections/${slug}`}
                    className="block px-4 py-3 transition hover:bg-white/5"
                    onClick={() => setCollectionsOpen(false)}
                  >
                    <span className="block text-sm font-bold text-zinc-100">
                      {COLLECTION_META[slug].title}
                    </span>
                    <span className="block text-xs text-muted">
                      {COLLECTION_META[slug].tagline}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/cart"
            className="relative inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2 text-sm font-bold text-zinc-100 transition hover:border-brand-500/60"
            aria-label={`Cart, ${count} items`}
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
              />
            </svg>
            <span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-gradient-to-r from-brand-500 to-coral-500 px-1.5 text-xs font-extrabold text-white">
                {count}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-zinc-200 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Toggle menu"
          >
            {open ? (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-line/60 bg-ink px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={linkCls(l.href)} onClick={closeMobile}>
                {l.label}
              </Link>
            ))}
            <p className="px-3 pb-1 pt-3 text-xs font-bold uppercase tracking-wider text-muted">
              Collections
            </p>
            {COLLECTION_SLUGS.map((slug) => (
              <Link
                key={slug}
                href={`/collections/${slug}`}
                className={linkCls(`/collections/${slug}`)}
                onClick={closeMobile}
              >
                {COLLECTION_META[slug].title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
    </>
  );
}
