import type { MenuItem } from './types.js';

/** Seed catalogue — stock is mutable in the in-memory store. */
export const SEED_MENU: MenuItem[] = [
  { id: 'burger', name: 'Classic Burger', pricePence: 899, stock: 10 },
  { id: 'fries', name: 'Fries', pricePence: 299, stock: 20 },
  { id: 'shake', name: 'Chocolate Shake', pricePence: 399, stock: 8 },
  { id: 'salad', name: 'Garden Salad', pricePence: 549, stock: 5 },
];

export function cloneMenu(menu: MenuItem[] = SEED_MENU): MenuItem[] {
  return menu.map((item) => ({ ...item }));
}

export function findItem(menu: MenuItem[], itemId: string): MenuItem | undefined {
  return menu.find((item) => item.id === itemId);
}
