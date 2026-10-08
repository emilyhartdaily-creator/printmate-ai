'use client';

import { useEffect } from 'react';
import { useCart } from '@/lib/cart';

/** Clears the cart once payment succeeds. */
export default function ClearCart() {
  const { clear } = useCart();
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}
