/**
 * Consumer/provider contract via shared Zod schemas.
 * Catches breaking API shape changes before UI/E2E ever runs.
 */
import { describe, expect, it } from 'vitest';
import {
  MenuResponseSchema,
  OrderFailureSchema,
  OrderRequestSchema,
  OrderSuccessSchema,
} from '../../src/domain/schemas.js';
import { CARDS, CARTS, SCHEMA_FIXTURES } from '../data/testData.js';

describe('API contract schemas', () => {
  it('accepts a valid menu response', () => {
    const parsed = MenuResponseSchema.parse(SCHEMA_FIXTURES.menuResponse);
    expect(parsed.items).toHaveLength(1);
  });

  it('rejects menu items with negative stock (provider must not emit)', () => {
    expect(() => MenuResponseSchema.parse(SCHEMA_FIXTURES.menuNegativeStock)).toThrow();
  });

  it('accepts a valid order request shape', () => {
    expect(OrderRequestSchema.parse({ ...CARTS.burgerX1, ...CARDS.valid })).toBeTruthy();
  });

  it('rejects empty cart at the contract boundary', () => {
    const result = OrderRequestSchema.safeParse({ ...CARTS.empty, ...CARDS.valid });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe('Cart must contain at least one item');
  });

  it('rejects past expiry at the contract boundary', () => {
    const result = OrderRequestSchema.safeParse({ ...CARTS.burgerX1, ...CARDS.expired });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.some((i) => /future date/i.test(i.message))).toBe(true);
  });

  it('requires cardholder name', () => {
    const result = OrderRequestSchema.safeParse({ ...CARTS.burgerX1, ...CARDS.blankName });
    expect(result.success).toBe(false);
  });

  it('requires expiry year to be four digits', () => {
    const result = OrderRequestSchema.safeParse({ ...CARTS.burgerX1, ...CARDS.twoDigitYear });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.some((i) => i.message === 'Expiry year should be four digits')).toBe(true);
  });

  it('keeps success and failure envelopes distinguishable', () => {
    const success = OrderSuccessSchema.parse(SCHEMA_FIXTURES.successEnvelope);
    const failure = OrderFailureSchema.parse(SCHEMA_FIXTURES.failureEnvelope);
    expect(success.ok).toBe(true);
    expect(failure.ok).toBe(false);
  });
});
