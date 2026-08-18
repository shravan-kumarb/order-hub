import { describe, expect, it } from 'vitest';
import { futureExpiry, processPayment } from '../../src/domain/payment.js';
import { validCard } from '../helpers/card.js';

describe('processPayment', () => {
  it('accepts a valid future card ending in an even digit', () => {
    expect(processPayment(validCard())).toEqual({ success: true });
  });

  it('declines a card ending in an odd digit', () => {
    expect(processPayment(validCard({ cardNumber: '4111111111111111' }))).toEqual({
      success: false,
      reason: 'Payment declined by issuer',
    });
  });

  it('requires cardholder name', () => {
    expect(processPayment(validCard({ cardName: ' ' }))).toEqual({
      success: false,
      reason: 'Cardholder name is required',
    });
  });

  it('requires expiry month and year in range', () => {
    expect(processPayment(validCard({ cardExpiryMonth: 0 }))).toMatchObject({
      success: false,
      reason: 'Expiry month must be between 1 and 12',
    });
  });

  it('requires expiry year to be four digits', () => {
    expect(processPayment(validCard({ cardExpiryYear: 30 }))).toEqual({
      success: false,
      reason: 'Expiry year should be four digits',
    });
  });

  it('rejects expired month/year', () => {
    expect(
      processPayment(validCard({ cardExpiryMonth: 1, cardExpiryYear: 2020 }), new Date('2026-08-11')),
    ).toEqual({
      success: false,
      reason: 'Card expiry must be a future date',
    });
  });

  it('accepts current month as still valid', () => {
    const now = new Date('2026-08-15');
    expect(
      processPayment(
        validCard({ cardExpiryMonth: 8, cardExpiryYear: 2026 }),
        now,
      ).success,
    ).toBe(true);
  });

  it('declines invalid card lengths', () => {
    expect(processPayment(validCard({ cardNumber: '123' }))).toMatchObject({
      success: false,
      reason: 'Card number must be 16 digits',
    });
  });

  it('ignores spaces when validating card number', () => {
    expect(processPayment(validCard({ cardNumber: '4111 1111 1111 1112' })).success).toBe(true);
  });

  it('futureExpiry returns next year December', () => {
    expect(futureExpiry(new Date('2026-08-11'))).toEqual({
      cardExpiryMonth: 12,
      cardExpiryYear: 2027,
    });
  });
});
