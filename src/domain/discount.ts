import type { CartLine, DiscountCode, MenuItem } from './types.js';
import { findItem } from './menu.js';

export const DISCOUNT_AMOUNTS = {
  MEALDEAL_PENCE: 200,
  FREESHIP_PENCE: 150,
  FREESHIP_MIN_PENCE: 1000,
} as const;

const VALID_CODES: DiscountCode[] = ['SAVE10', 'MEALDEAL', 'FREESHIP'];

export function isValidDiscountCode(code: string | undefined): code is DiscountCode {
  if (!code) return true;
  return (VALID_CODES as string[]).includes(code);
}

type DiscountStrategy = (
  menu: MenuItem[],
  cart: CartLine[],
  subtotalPence: number,
) => { discountPence: number; error?: string };

const STRATEGIES: Record<DiscountCode, DiscountStrategy> = {
  SAVE10: (_menu, _cart, subtotal) => ({
    discountPence: Math.floor(subtotal * 0.1),
  }),

  MEALDEAL: (_menu, cart) => {
    const hasBurger = cart.some((l) => l.itemId === 'burger' && l.quantity > 0);
    const hasFries  = cart.some((l) => l.itemId === 'fries'  && l.quantity > 0);
    return hasBurger && hasFries
      ? { discountPence: DISCOUNT_AMOUNTS.MEALDEAL_PENCE }
      : { discountPence: 0, error: 'MEALDEAL requires a burger and fries in the cart' };
  },

  FREESHIP: (_menu, _cart, subtotal) =>
    subtotal >= DISCOUNT_AMOUNTS.FREESHIP_MIN_PENCE
      ? { discountPence: DISCOUNT_AMOUNTS.FREESHIP_PENCE }
      : { discountPence: 0, error: 'FREESHIP requires a subtotal of at least £10' },
};

export function calculateDiscountPence(
  menu: MenuItem[],
  cart: CartLine[],
  subtotalPence: number,
  code?: string,
): { discountPence: number; error?: string } {
  if (!code) return { discountPence: 0 };
  if (!isValidDiscountCode(code)) {
    return { discountPence: 0, error: `Unknown discount code: ${code}` };
  }
  return STRATEGIES[code](menu, cart, subtotalPence);
}

export function cartSubtotalPence(menu: MenuItem[], cart: CartLine[]): number {
  return cart.reduce((sum, line) => {
    const item = findItem(menu, line.itemId);
    if (!item) return sum;
    return sum + item.pricePence * line.quantity;
  }, 0);
}
