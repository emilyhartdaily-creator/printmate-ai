import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductDetail from '@/components/ProductDetail';
import { getProduct } from '@/lib/products';


// Revalidate catalog data every 5 minutes so admin/DB changes go live without a redeploy.
export const revalidate = 300;
export default async function ProductPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { design?: string };
}) {
  const product = await getProduct(params.id);
  if (!product) notFound();

  return (
    <>
      <Navbar />
      <main>
        <ProductDetail product={product} initialDesign={searchParams.design} />
      </main>
      <Footer />
    </>
  );
}
