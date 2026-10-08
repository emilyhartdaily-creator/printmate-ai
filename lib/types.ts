// Shared domain types for PrintMate AI.
// Money is stored as integer cents everywhere.

export type ProductCategory =
  | 'tshirts'
  | 'hoodies'
  | 'mugs'
  | 'posters'
  | 'stickers';

export type CollectionSlug = 'memes' | 'political-humor' | 'romantic-gifts';

export interface Product {
  id: string;
  name: string;
  description: string;
  /** price in cents */
  base_price: number;
  category: ProductCategory;
  image_url: string;
  colors: string[];
  sizes: string[];
  tags: string[];
  collection?: CollectionSlug;
  active: boolean;
}

export interface CartItem {
  /** unique key: product_id + size + color + design_url */
  key: string;
  product_id: string;
  name: string;
  base_price: number;
  image_url: string;
  size: string;
  color: string;
  design_url?: string;
  qty: number;
}

export interface PrintPartner {
  id: string;
  name: string;
  email: string;
  city: string;
  postal_code: string;
  active: boolean;
}

export interface PromoCode {
  id: string;
  code: string;
  percent_off: number;
  active: boolean;
}

export interface Customer {
  id: string;
  email: string;
  name: string;
  city?: string;
  postal_code?: string;
  created_at: string;
}

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'sent_to_printer'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface OrderRecord {
  id: string;
  email: string;
  customer_name: string;
  items: CartItem[];
  /** cents */
  subtotal: number;
  /** cents */
  discount: number;
  /** cents */
  total: number;
  currency: string;
  status: OrderStatus;
  stripe_session_id: string;
  print_partner_id?: string;
  city?: string;
  postal_code?: string;
  created_at: string;
}

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  tshirts: 'T-Shirts',
  hoodies: 'Hoodies',
  mugs: 'Mugs',
  posters: 'Posters',
  stickers: 'Stickers',
};

export const COLLECTION_META: Record<
  CollectionSlug,
  { title: string; tagline: string }
> = {
  memes: {
    title: 'Meme Collection',
    tagline: 'Internet-grade humor, printed on premium blanks.',
  },
  'political-humor': {
    title: 'Political Humor',
    tagline:
      'Light, non-partisan civic comedy. No real people, no hate — just laughs.',
  },
  'romantic-gifts': {
    title: 'Romantic Gifts',
    tagline: 'Sweet, tasteful designs for the people you love.',
  },
};

export const ADMIN_RESOURCES = [
  'products',
  'orders',
  'customers',
  'print_partners',
  'promo_codes',
] as const;

export type AdminResource = (typeof ADMIN_RESOURCES)[number];
