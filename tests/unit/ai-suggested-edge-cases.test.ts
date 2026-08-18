/**
 * AI-suggested edge cases — see docs/AI_CURATION.md for promotion criteria and decision log.
 * Each test is tagged // AI[case-id] pass-N promoted, or // Independently written if it
 * has no corresponding generated case.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { calculateDiscountPence } from '../../src/domain/discount.js';
import { cloneMenu } from '../../src/domain/menu.js';
import { placeOrder, resetOrderSeq } from '../../src/domain/order.js';
import type { MenuItem } from '../../src/domain/types.js';
import { CARDS, CARTS, DISCOUNTS, STOCK } from '../data/testData.js';

describe('AI-suggested edge cases', () => {
  let menu: MenuItem[];

  beforeEach(() => {
    menu = cloneMenu();
    resetOrderSeq(1);
  });

  // Independently written — quantity zero is distinct from insufficient stock
  it('rejects quantity zero even if item exists', () => {
    expect(placeOrder(menu, { ...CARTS.zeroQuantity, ...CARDS.valid }))
      .toMatchObject({ ok: false, error: 'INVALID_QUANTITY' });
  });

  // AI[unknown-item-casing] pass-1 promoted: item ID case sensitivity is a catalog contract question
  it('rejects unknown item ids that look similar to real ones', () => {
    expect(placeOrder(menu, { ...CARTS.uppercaseItem, ...CARDS.valid }))
      .toMatchObject({ ok: false, error: 'UNKNOWN_ITEM' });
  });

  // AI[stock-boundary-plus-one] pass-1 promoted: core oversell invariant, non-obvious off-by-one
  it('does not allow ordering exactly stock + 1', () => {
    const salad = menu.find((i) => i.id === STOCK.salad.itemId)!;
    expect(placeOrder(menu, { cart: [{ itemId: STOCK.salad.itemId, quantity: salad.stock + 1 }], ...CARDS.valid }))
      .toMatchObject({ ok: false, error: 'INSUFFICIENT_STOCK' });
  });

  // AI[stock-exact] pass-1 promoted: boundary success path; confirms stock reaches zero correctly
  it('allows ordering exactly remaining stock', () => {
    const salad = menu.find((i) => i.id === STOCK.salad.itemId)!;
    const result = placeOrder(menu, { cart: [{ itemId: STOCK.salad.itemId, quantity: salad.stock }], ...CARDS.valid });
    expect(result.ok).toBe(true);
    expect(menu.find((i) => i.id === STOCK.salad.itemId)!.stock).toBe(0);
  });

  // Independently written — negative total prevention is a money invariant
  it('never returns a negative total when discount exceeds subtotal', () => {
    const result = placeOrder(menu, { ...CARTS.friesOnly, ...CARDS.altSuccess, ...DISCOUNTS.save10 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.totalPence).toBeGreaterThanOrEqual(0);
    expect(result.totalPence).toBe(result.subtotalPence - result.discountPence);
  });

  // AI[discount-case-sensitivity] pass-1 promoted: case-sensitive contract must be locked in tests
  it('treats lowercase discount codes as invalid (explicit contract)', () => {
    expect(placeOrder(menu, { ...CARTS.burgerAndFries, ...CARDS.valid, ...DISCOUNTS.lowercaseMealdeal }))
      .toMatchObject({ ok: false, error: 'INVALID_DISCOUNT' });
  });

  // AI[payment-space-odd] pass-1 promoted: space stripping + even/odd interaction is non-obvious
  it('declines cards with odd last digit even when padded with spaces', () => {
    expect(placeOrder(menu, { ...CARTS.burgerX1, ...CARDS.spacedOddNumber }))
      .toMatchObject({ ok: false, error: 'PAYMENT_DECLINED' });
  });

  // AI[expiry-year-two-digits] pass-1 promoted: two-digit year must not reach payment processing
  it('rejects two-digit expiry years before charging', () => {
    const before = menu.map((i) => ({ ...i }));
    expect(placeOrder(menu, { ...CARTS.burgerX1, ...CARDS.twoDigitYear }))
      .toMatchObject({ ok: false, error: 'INVALID_CARD', message: 'Expiry year should be four digits' });
    expect(menu).toEqual(before);
  });

  // Independently written — SAVE10 math on a low-price item
  it('SAVE10 on fries only: discountPence is 29 and totalPence is 270 (not negative)', () => {
    const result = placeOrder(menu, { ...CARTS.friesOnly, ...CARDS.altSuccess, ...DISCOUNTS.save10 }); // 299p
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.discountPence).toBe(29);  // floor(299 × 0.1) = 29
    expect(result.totalPence).toBe(270);    // 299 − 29 = 270
  });

  // Independently written — multi-item order deducts stock from all lines atomically
  it('order spanning two items reduces each item stock independently', () => {
    const { drainItemId, secondItemId, secondItemQuantity } = STOCK.multiItem;
    const saladStock = menu.find((i) => i.id === drainItemId)!.stock;
    const burgerBefore = menu.find((i) => i.id === secondItemId)!.stock;
    const result = placeOrder(menu, {
      cart: [{ itemId: drainItemId, quantity: saladStock }, { itemId: secondItemId, quantity: secondItemQuantity }],
      ...CARDS.valid,
    });
    expect(result.ok).toBe(true);
    expect(menu.find((i) => i.id === drainItemId)!.stock).toBe(0);
    expect(menu.find((i) => i.id === secondItemId)!.stock).toBe(burgerBefore - secondItemQuantity);
  });

  // Independently written — 3 spaces has raw length ≥ 2 but trims to blank
  it('rejects card name that is three spaces — non-empty raw length but blank after trim', () => {
    const before = menu.map((i) => ({ ...i }));
    expect(placeOrder(menu, { ...CARTS.friesOnly, ...CARDS.threeSpacesName }))
      .toMatchObject({ ok: false, error: 'INVALID_CARD', message: 'Cardholder name is required' });
    expect(menu).toEqual(before);
  });

  // U-16: exactly 1000p qualifies; subtotalPence < 1000 is the gate
  it('FREESHIP succeeds at exactly 1000p — the minimum qualifying subtotal', () => {
    const { subtotalPence, discountCode } = DISCOUNTS.freeshipBoundary;
    const { discountPence, error } = calculateDiscountPence(menu, [], subtotalPence, discountCode);
    expect(error).toBeUndefined();
    expect(discountPence).toBe(150);
  });

  // U-17: single char — confirms threshold is min(2) not min(1)
  it('rejects card name with a single character — length 1 is below the 2-char minimum', () => {
    const before = menu.map((i) => ({ ...i }));
    expect(placeOrder(menu, { ...CARTS.friesOnly, ...CARDS.singleCharName }))
      .toMatchObject({ ok: false, error: 'INVALID_CARD', message: 'Cardholder name is required' });
    expect(menu).toEqual(before);
  });

  // AI[card-name-required] pass-1 promoted: whitespace-only name must be rejected before charging
  it('rejects blank cardholder name before charging', () => {
    const before = menu.map((i) => ({ ...i }));
    expect(placeOrder(menu, { ...CARTS.friesOnly, ...CARDS.twoSpacesName }))
      .toMatchObject({ ok: false, error: 'INVALID_CARD', message: 'Cardholder name is required' });
    expect(menu).toEqual(before);
  });
});
