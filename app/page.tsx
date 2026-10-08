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
