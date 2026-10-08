'use client';

import { useMemo, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import { CATEGORY_LABELS, type Product, type ProductCategory } from '@/lib/types';

type SortMode = 'featured' | 'price-asc' | 'price-desc';

const CATEGORIES: (ProductCategory | 'all')[] = [
  'all',
  ...Object.keys(CATEGORY_LABELS),
] as (ProductCategory | 'all')[];

export default function ShopClient({
  products,
  initialCategory = 'all',
}: {
  products: Product[];
  initialCategory?: ProductCategory | 'all';
}) {
  const [category, setCategory] = useState<ProductCategory | 'all'>(initialCategory);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortMode>('featured');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = products.filter((p) => {
      const matchesCategory = category === 'all' || p.category === category;
      const matchesQuery =
        q.length === 0 ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q));
      return matchesCategory && matchesQuery;
    });
    const sorted = [...filtered];
    if (sort === 'price-asc') sorted.sort((a, b) => a.base_price - b.base_price);
    if (sort === 'price-desc') sorted.sort((a, b) => b.base_price - a.base_price);
    return sorted;
  }, [products, category, query, sort]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="section-title">
        Shop <span className="gradient-text">everything</span>
      </h1>
      <p className="mt-2 text-muted">
        Premium blanks, ready for your design. {products.length} products.
      </p>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`chip ${category === c ? 'chip-active' : ''}`}
              aria-pressed={category === c}
            >
              {c === 'all' ? 'All' : CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="input sm:w-64"
            aria-label="Search products"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="input sm:w-52"
            aria-label="Sort products"
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="card mt-10 text-center">
          <p className="font-display text-xl font-bold">No products found</p>
          <p className="mt-2 text-sm text-muted">
            Try a different search term or category.
          </p>
          <button
            type="button"
            className="btn-secondary mt-6"
            onClick={() => {
              setQuery('');
              setCategory('all');
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
