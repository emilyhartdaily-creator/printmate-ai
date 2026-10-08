import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StudioClient from '@/components/StudioClient';
import { getProducts } from '@/lib/products';

export default async function StudioPage() {
  const products = await getProducts();

  return (
    <>
      <Navbar />
      <main>
        <StudioClient products={products} />
      </main>
      <Footer />
    </>
  );
}
