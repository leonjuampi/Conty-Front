import { useEffect, useState, useCallback } from 'react';
import type { CartItem } from '../../services/publicStore.service';

const KEY = (slug: string) => `conty_cart_${slug}`;

function readCart(slug: string): CartItem[] {
  try {
    const raw = localStorage.getItem(KEY(slug));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeCart(slug: string, items: CartItem[]) {
  localStorage.setItem(KEY(slug), JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('conty-cart-changed', { detail: { slug } }));
}

export function useCart(slug: string) {
  const [items, setItems] = useState<CartItem[]>(() => readCart(slug));

  useEffect(() => {
    const handler = () => setItems(readCart(slug));
    window.addEventListener('conty-cart-changed', handler);
    return () => window.removeEventListener('conty-cart-changed', handler);
  }, [slug]);

  const addItem = useCallback((item: CartItem) => {
    const current = readCart(slug);
    const idx = current.findIndex(
      (i) => i.product_id === item.product_id && (i.variant_id ?? null) === (item.variant_id ?? null)
    );
    if (idx >= 0) {
      current[idx].qty += item.qty;
    } else {
      current.push(item);
    }
    writeCart(slug, current);
  }, [slug]);

  const updateQty = useCallback((index: number, qty: number) => {
    const current = readCart(slug);
    if (qty <= 0) current.splice(index, 1);
    else current[index].qty = qty;
    writeCart(slug, current);
  }, [slug]);

  const removeItem = useCallback((index: number) => {
    const current = readCart(slug);
    current.splice(index, 1);
    writeCart(slug, current);
  }, [slug]);

  const clear = useCallback(() => {
    writeCart(slug, []);
  }, [slug]);

  const subtotal = items.reduce((s, i) => s + i.qty * i.unit_price, 0);
  const totalItems = items.reduce((s, i) => s + i.qty, 0);

  return { items, addItem, updateQty, removeItem, clear, subtotal, totalItems };
}
