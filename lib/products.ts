import type { Product } from './types';
import { getSupabase } from './supabase';

/**
 * Demo catalog used when Supabase is not configured.
 * Focused range: T-shirts & mugs only (expand later via the admin panel).
 * Worker C: seed these SAME 6 products in supabase/schema.sql.
 */
export const DEMO_PRODUCTS: Product[] = [
  {
    id: 't1',
    name: 'Essential Crew Tee',
    description:
      'A heavyweight 100% cotton tee with a perfect everyday fit. Your design, printed in crisp high resolution.',
    base_price: 2499,
    category: 'tshirts',
    image_url: 'https://picsum.photos/seed/printmate-tee1/800/800',
    colors: ['Black', 'White', 'Navy', 'Heather Gray'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    tags: ['memes', 'bestseller'],
    collection: 'memes',
    active: true,
  },
  {
    id: 't2',
    name: 'Vintage Wash Tee',
    description:
      'Garment-dyed tee with a lived-in vintage feel. Soft from day one, funnier every wear.',
    base_price: 2799,
    category: 'tshirts',
    image_url: 'https://picsum.photos/seed/printmate-tee2/800/800',
    colors: ['Washed Black', 'Washed Navy', 'Sand'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    tags: ['political-humor'],
    collection: 'political-humor',
    active: true,
  },
  {
    id: 't3',
    name: 'Heavyweight Boxy Tee',
    description:
      'Thick, structured boxy-fit tee with a premium streetwear feel. Built to hold bold prints.',
    base_price: 2999,
    category: 'tshirts',
    image_url: 'https://picsum.photos/seed/printmate-tee3/800/800',
    colors: ['Black', 'White', 'Forest'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    tags: ['memes', 'new'],
    collection: 'memes',
    active: true,
  },
  {
    id: 'm1',
    name: 'Morning Roast Mug',
    description:
      '11oz ceramic mug with a glossy finish. Dishwasher and microwave safe — humor included free.',
    base_price: 1499,
    category: 'mugs',
    image_url: 'https://picsum.photos/seed/printmate-mug1/800/800',
    colors: ['White', 'Black'],
    sizes: ['11oz'],
    tags: ['political-humor', 'funny'],
    collection: 'political-humor',
    active: true,
  },
  {
    id: 'm2',
    name: 'Enamel Camp Mug',
    description:
      'Classic enamel campfire mug with a speckled finish. For slow mornings and sweet notes.',
    base_price: 1899,
    category: 'mugs',
    image_url: 'https://picsum.photos/seed/printmate-mug2/800/800',
    colors: ['White/Black rim', 'White/Coral rim'],
    sizes: ['12oz'],
    tags: ['romantic-gifts'],
    collection: 'romantic-gifts',
    active: true,
  },
  {
    id: 'm3',
    name: 'Magic Reveal Mug',
    description:
      'Color-changing 11oz mug — pour hot coffee and watch your design magically appear.',
    base_price: 1699,
    category: 'mugs',
    image_url: 'https://picsum.photos/seed/printmate-mug3/800/800',
    colors: ['Black'],
    sizes: ['11oz'],
    tags: ['memes', 'new'],
    collection: 'memes',
    active: true,
  },
];

/** Fetch active products from Supabase, falling back to demo data. */
export async function getProducts(): Promise<Product[]> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('products')
        .select('*')
        .eq('active', true)
        .order('name');
      if (!error && data && data.length > 0) return data as Product[];
    } catch {
      /* fall through to demo data */
    }
  }
  return DEMO_PRODUCTS.filter((p) => p.active);
}

export async function getProduct(id: string): Promise<Product | null> {
  const products = await getProducts();
  return products.find((p) => p.id === id) ?? null;
}
