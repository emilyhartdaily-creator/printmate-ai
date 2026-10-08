import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { getProducts } from '@/lib/products';
import { COLLECTION_META, type CollectionSlug } from '@/lib/types';

const SLUGS = Object.keys(COLLECTION_META) as CollectionSlug[];

export function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }));
}

export default async function CollectionPage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = params.slug as CollectionSlug;
  if (!COLLECTION_META[slug]) notFound();

  const products = await getProducts();
  const collectionProducts = products.filter((p) => p.collection === slug);
  const meta = COLLECTION_META[slug];

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h1 className="section-title">
          {meta.title.split(' ')[0]}{' '}
          <span className="gradient-text">
            {meta.title.split(' ').slice(1).join(' ')}
          </span>
        </h1>
        <p className="mt-2 text-muted">{meta.tagline}</p>

        {slug === 'political-humor' && (
          <div className="card mt-6 !p-4 text-sm text-muted">
            Light, non-partisan fun — no real people, no hate.
          </div>
        )}

        {collectionProducts.length === 0 ? (
          <div className="card mt-10 text-center">
            <p className="font-display text-xl font-bold">Nothing here yet</p>
            <p className="mt-2 text-sm text-muted">
              This collection is being restocked. Check back soon.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {collectionProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
