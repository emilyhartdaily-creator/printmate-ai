/** Format integer cents as $X.XX */
export function formatPrice(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

export function cartKey(
  product_id: string,
  size: string,
  color: string,
  design_url?: string,
): string {
  return [product_id, size, color, design_url ?? ''].join('|');
}
