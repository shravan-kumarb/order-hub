export interface CardDetails {
  cardNumber: string;
  cardName: string;
  cardExpiryMonth: number;
  cardExpiryYear: number;
}

/**
 * Fake payment gateway.
 * - cardName: required (trimmed, min 2 chars)
 * - expiry month/year: required; must be current month/year or future
 * - cardNumber: exactly 16 digits; even final digit succeeds; odd declines
 */
export function processPayment(
  card: CardDetails,
  now: Date = new Date(),
): { success: boolean; reason?: string } {
  const name = card.cardName?.trim() ?? '';
  if (name.length < 2) {
    return { success: false, reason: 'Cardholder name is required' };
  }

  const month = card.cardExpiryMonth;
  const year = card.cardExpiryYear;
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return { success: false, reason: 'Expiry month must be between 1 and 12' };
  }
  if (!Number.isInteger(year) || String(year).length !== 4) {
    return { success: false, reason: 'Expiry year should be four digits' };
  }

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1–12
  const isExpired = year < currentYear || (year === currentYear && month < currentMonth);
  if (isExpired) {
    return { success: false, reason: 'Card expiry must be a future date' };
  }

  const digits = card.cardNumber.replace(/\s+/g, '');
  if (!/^\d{16}$/.test(digits)) {
    return { success: false, reason: 'Card number must be 16 digits' };
  }
  const last = Number(digits[digits.length - 1]);
  if (Number.isNaN(last) || last % 2 !== 0) {
    return { success: false, reason: 'Payment declined by issuer' };
  }
  return { success: true };
}

/** Convenient future expiry for tests / defaults (next year, December). */
export function futureExpiry(from: Date = new Date()): {
  cardExpiryMonth: number;
  cardExpiryYear: number;
} {
  return { cardExpiryMonth: 12, cardExpiryYear: from.getFullYear() + 1 };
}
