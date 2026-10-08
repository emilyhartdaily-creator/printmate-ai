import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ShopClient from '@/components/ShopClient';
import { getProducts } from '@/lib/products';
import { CATEGORY_LABELS } from '@/lib/types';

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const products = await getProducts();
  const requested = searchParams.category;
  // Accept known categories plus any custom ones present in the catalog.
  const valid = new Set([
    ...Object.keys(CATEGORY_LABELS),
    ...products.map((p) => p.category),
  ]);
  const initialCategory = requested && valid.has(requested) ? requested : 'all';

  return (
    <>
      <Navbar />
      <main>
        <ShopClient products={products} initialCategory={initialCategory} />
      </main>
      <Footer />
    </>
  );
}
