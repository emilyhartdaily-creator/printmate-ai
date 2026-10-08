import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { getProducts } from '@/lib/products';
import { COLLECTION_META, type CollectionSlug } from '@/lib/types';

const STEPS = [
  {
    n: '01',
    title: 'Design',
    text: 'Describe your idea in the AI Studio or upload artwork. You see a live preview on the product.',
  },
  {
    n: '02',
    title: 'We print',
    text: 'Your order is routed to the nearest local print partner for fast, high-quality printing.',
  },
  {
    n: '03',
    title: 'Delivered',
    text: 'Printed on demand and shipped straight to your door — no inventory, no waste.',
  },
] as const;

const STATS = [
  { value: '8+', label: 'Product blanks' },
  { value: '24h', label: 'Avg. print start' },
  { value: '100%', label: 'Print-on-demand' },
  { value: '0', label: 'Minimum order' },
] as const;

const TRUST = [
  'Made in the USA',
  '30-day money-back guarantee',
  'Secure checkout',
] as const;

const TESTIMONIALS = [
  {
    quote:
      'Designed a hoodie in the Studio in like two minutes and it showed up looking exactly like the preview. My new favorite thing to wear.',
    name: 'Jessica M.',
    city: 'Austin, TX',
  },
  {
    quote:
      'Ordered matching tees for our whole family reunion. Print quality is legit — colors pop and the fabric feels premium.',
    name: 'Marcus T.',
    city: 'Columbus, OH',
  },
  {
    quote:
      'I sell my designs through PrintMate now. Zero inventory, zero hassle, and my customers keep coming back for more.',
    name: 'Emily R.',
    city: 'Portland, OR',
  },
] as const;

export default async function HomePage() {
  const products = await getProducts();
  const trending = products.slice(0, 4);

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-4 pb-16 pt-16 text-center sm:px-6 md:pt-24">
          <span className="badge">AI-powered print-on-demand</span>
          <h1 className="mx-auto mt-6 max-w-3xl font-display text-5xl font-extrabold leading-tight tracking-tight md:text-7xl">
            <span className="gradient-text">Design it.</span> We print it.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
            Turn your ideas into custom tees, hoodies, mugs, posters and
            stickers. Design with AI in seconds, printed on demand and
            delivered to your door.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/studio" className="btn-primary w-full sm:w-auto">
              Start Designing
            </Link>
            <Link href="/shop" className="btn-secondary w-full sm:w-auto">
              Shop the Collection
            </Link>
          </div>
          <div className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm font-semibold text-muted">
            {TRUST.map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <span className="text-brand-400">✓</span> {t}
              </span>
            ))}
          </div>
        </section>

        {/* Trending */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="flex items-end justify-between">
            <h2 className="section-title">Trending now</h2>
            <Link href="/shop" className="text-sm font-bold text-brand-300 transition hover:text-brand-400">
              View all →
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {trending.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>

        {/* Collections */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <h2 className="section-title">Shop by collection</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {(Object.keys(COLLECTION_META) as CollectionSlug[]).map((slug) => (
              <Link
                key={slug}
                href={`/collections/${slug}`}
                className="card group transition-all hover:-translate-y-1 hover:border-brand-500/50"
              >
                <h3 className="font-display text-xl font-extrabold transition group-hover:text-brand-300">
                  {COLLECTION_META[slug].title}
                </h3>
                <p className="mt-2 text-sm text-muted">{COLLECTION_META[slug].tagline}</p>
                <p className="mt-4 text-sm font-bold text-brand-300">Explore →</p>
              </Link>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <h2 className="section-title text-center">How it works</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="card">
                <p className="gradient-text font-display text-4xl font-extrabold">{s.n}</p>
                <h3 className="mt-3 font-display text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-line/60 bg-surface/50">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="gradient-text font-display text-4xl font-extrabold md:text-5xl">
                  {s.value}
                </p>
                <p className="mt-1 text-sm text-muted">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <h2 className="section-title text-center">Loved across the USA</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="card flex flex-col">
                <div className="text-lg tracking-widest text-brand-400" aria-label="5 out of 5 stars">
                  ★★★★★
                </div>
                <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-zinc-200">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-4 text-sm">
                  <span className="font-bold text-zinc-100">{t.name}</span>
                  <span className="text-muted"> · {t.city}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="card relative overflow-hidden text-center !p-10 md:!p-16">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-500/15 via-transparent to-coral-500/15" />
            <h2 className="relative font-display text-3xl font-extrabold tracking-tight md:text-5xl">
              Your next favorite thing <span className="gradient-text">starts with an idea.</span>
            </h2>
            <p className="relative mx-auto mt-4 max-w-lg text-muted">
              Open the Studio, type a prompt, and watch your design come to life
              on premium products.
            </p>
            <Link href="/studio" className="btn-primary relative mt-8">
              Create yours today
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
