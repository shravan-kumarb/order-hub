import { describe, expect, it } from 'vitest';
import { calculateDiscountPence, cartSubtotalPence } from '../../src/domain/discount.js';
import { cloneMenu } from '../../src/domain/menu.js';

describe('discounts', () => {
  const menu = cloneMenu();

  it('SAVE10 takes 10% off subtotal', () => {
    const cart = [{ itemId: 'burger', quantity: 1 }];
    const subtotal = cartSubtotalPence(menu, cart);
    expect(calculateDiscountPence(menu, cart, subtotal, 'SAVE10')).toEqual({
      discountPence: Math.floor(subtotal * 0.1),
    });
  });

  it('MEALDEAL requires burger and fries', () => {
    const cart = [{ itemId: 'burger', quantity: 1 }];
    const subtotal = cartSubtotalPence(menu, cart);
    expect(calculateDiscountPence(menu, cart, subtotal, 'MEALDEAL').error).toMatch(/burger and fries/i);
  });

  it('MEALDEAL applies £2 when combo present', () => {
    const cart = [
      { itemId: 'burger', quantity: 1 },
      { itemId: 'fries', quantity: 1 },
    ];
    const subtotal = cartSubtotalPence(menu, cart);
    expect(calculateDiscountPence(menu, cart, subtotal, 'MEALDEAL')).toEqual({
      discountPence: 200,
    });
  });

  it('FREESHIP requires £10 subtotal', () => {
    const cart = [{ itemId: 'fries', quantity: 1 }];
    const subtotal = cartSubtotalPence(menu, cart);
    expect(calculateDiscountPence(menu, cart, subtotal, 'FREESHIP').error).toMatch(/£10/);
  });

  it('rejects unknown codes', () => {
    expect(calculateDiscountPence(menu, [], 0, 'HACKER').error).toMatch(/Unknown/);
  });
});
