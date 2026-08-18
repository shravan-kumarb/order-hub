import { beforeEach, describe, expect, it } from 'vitest';
import { cloneMenu } from '../../src/domain/menu.js';
import { placeOrder, resetOrderSeq } from '../../src/domain/order.js';
import type { MenuItem } from '../../src/domain/types.js';
import { CARDS, CARTS, DISCOUNTS } from '../data/testData.js';

describe('placeOrder', () => {
  let menu: MenuItem[];

  beforeEach(() => {
    menu = cloneMenu();
    resetOrderSeq(1);
  });

  it('places a successful order and reduces stock', () => {
    const before = menu.find((i) => i.id === 'burger')!.stock;
    const result = placeOrder(menu, { ...CARTS.burgerX2, ...CARDS.valid });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.orderId).toBe('ORD-0001');
    expect(result.totalPence).toBe(899 * 2);
    expect(result.remainingStock.burger).toBe(before - 2);
  });

  it('does not mutate stock when payment declines', () => {
    const before = menu.map((i) => ({ ...i }));
    expect(placeOrder(menu, { ...CARTS.shakeOnly, ...CARDS.declined }))
      .toMatchObject({ ok: false, error: 'PAYMENT_DECLINED' });
    expect(menu).toEqual(before);
  });

  it('rejects expired cards without charging', () => {
    const before = menu.map((i) => ({ ...i }));
    expect(placeOrder(menu, { ...CARTS.burgerX1, ...CARDS.expired }))
      .toMatchObject({ ok: false, error: 'INVALID_CARD' });
    expect(menu).toEqual(before);
  });

  it('rejects missing cardholder name', () => {
    expect(placeOrder(menu, { ...CARTS.burgerX1, ...CARDS.blankName }))
      .toMatchObject({ ok: false, error: 'INVALID_CARD' });
  });

  it('rejects insufficient stock before payment', () => {
    expect(placeOrder(menu, { ...CARTS.saladInsufficient, ...CARDS.valid }))
      .toMatchObject({ ok: false, error: 'INSUFFICIENT_STOCK' });
  });

  it('rejects empty cart', () => {
    expect(placeOrder(menu, { ...CARTS.empty, ...CARDS.valid }))
      .toMatchObject({ ok: false, error: 'EMPTY_CART' });
  });

  it('applies SAVE10 on successful payment', () => {
    const result = placeOrder(menu, { ...CARTS.burgerX1, ...CARDS.valid, ...DISCOUNTS.save10 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.discountPence).toBe(89);
    expect(result.totalPence).toBe(899 - 89);
  });

  it('rejects invalid discount eligibility without charging', () => {
    const beforeShake = menu.find((i) => i.id === 'shake')!.stock;
    expect(placeOrder(menu, { ...CARTS.shakeOnly, ...CARDS.valid, ...DISCOUNTS.mealdeal }))
      .toMatchObject({ ok: false, error: 'INVALID_DISCOUNT' });
    expect(menu.find((i) => i.id === 'shake')!.stock).toBe(beforeShake);
  });
});
