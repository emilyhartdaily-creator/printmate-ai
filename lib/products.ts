import type { Product } from './types';
import { getSupabase } from './supabase';

/**
 * Demo catalog used when Supabase is not configured.
 * Worker C: seed these SAME 8 products in supabase/schema.sql.
 */
export const DEMO_PRODUCTS: Product[] = [
  {
    id: 'p1',
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
    id: 'p2',
    name: 'CloudSoft Hoodie',
    description:
      'Ultra-soft fleece hoodie with a cozy double-lined hood. A gift they will actually wear.',
    base_price: 4999,
    category: 'hoodies',
    image_url: 'https://picsum.photos/seed/printmate-hoodie1/800/800',
    colors: ['Black', 'Charcoal', 'Purple'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    tags: ['romantic-gifts', 'cozy'],
    collection: 'romantic-gifts',
    active: true,
  },
  {
    id: 'p3',
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
    id: 'p4',
    name: 'Gallery Poster 18×24',
    description:
      'Museum-quality matte poster on thick archival paper. Ships rolled in a protective tube.',
    base_price: 1999,
    category: 'posters',
    image_url: 'https://picsum.photos/seed/printmate-poster1/800/800',
    colors: ['White'],
    sizes: ['18×24'],
    tags: ['memes', 'romantic-gifts', 'wall-art'],
    collection: 'memes',
    active: true,
  },
  {
    id: 'p5',
    name: 'Vinyl Sticker Pack',
    description:
      'Set of 5 weatherproof vinyl stickers with vibrant UV-resistant inks. Laptops, bottles, everything.',
    base_price: 999,
    category: 'stickers',
    image_url: 'https://picsum.photos/seed/printmate-sticker1/800/800',
    colors: ['Multi'],
    sizes: ['Pack of 5'],
    tags: ['memes'],
    collection: 'memes',
    active: true,
  },
  {
    id: 'p6',
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
    id: 'p7',
    name: 'Studio Zip Hoodie',
    description:
      'Full-zip midweight hoodie with metal zipper and side pockets. Street-ready comfort.',
    base_price: 5499,
    category: 'hoodies',
    image_url: 'https://picsum.photos/seed/printmate-hoodie2/800/800',
    colors: ['Black', 'Gray', 'Coral'],
    sizes: ['S', 'M', 'L', 'XL'],
    tags: ['memes', 'new'],
    active: true,
  },
  {
    id: 'p8',
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
