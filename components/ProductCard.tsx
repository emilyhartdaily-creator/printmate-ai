import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import { categoryLabel } from '@/lib/types';

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/product/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-card transition-all duration-200 hover:-translate-y-1.5 hover:border-brand-500/50 hover:shadow-2xl hover:shadow-brand-600/20"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-surface">
        <Image
          src={product.image_url}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="badge absolute left-3 top-3 !bg-ink/70 backdrop-blur">
          {categoryLabel(product.category)}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-base font-bold leading-snug text-ink transition group-hover:text-brand-600">
          {product.name}
        </h3>
        <p className="mt-auto pt-1 text-lg font-extrabold text-ink">
          {formatPrice(product.base_price)}
        </p>
      </div>
    </Link>
  );
}
