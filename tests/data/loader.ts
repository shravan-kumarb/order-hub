import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA_DIR = dirname(fileURLToPath(import.meta.url));

/**
 * Load test data from a JSON file under tests/data/.
 * Pass a domain-relative path without the .json extension.
 * Examples:
 *   loadTestData<CardData>('cards/declined')
 *   loadTestData<CartData>('carts/burger-x2')
 *   loadTestData<DiscountData>('discounts/save10')
 */
export function loadTestData<T>(relativePath: string): T {
  const fullPath = join(DATA_DIR, `${relativePath}.json`);
  return JSON.parse(readFileSync(fullPath, 'utf-8')) as T;
}

// ── Domain primitives ──────────────────────────────────────────────────────

/** Payment card data — cards/ */
export type CardData = {
  cardNumber: string;
  cardName: string;
  cardExpiryMonth: number;
  cardExpiryYear: number;
};

/** Cart composition — carts/ */
export type CartData = {
  cart: Array<{ itemId: string; quantity: number }>;
};

/** Discount code — discounts/ */
export type DiscountData = {
  discountCode: string;
};

/** Stock-related data where quantity is computed at runtime from menu state — stock/ */
export type StockItemData = {
  itemId: string;
};

// ── Composite helper (unit + API tests spread all three) ───────────────────

/** Full order request built by spreading CartData + CardData + optional DiscountData. */
export type OrderRequestData = CartData & CardData & Partial<DiscountData>;

// ── E2E UI journey data ────────────────────────────────────────────────────

/** Payment form overrides passed to order.pay() — all strings because they fill HTML inputs. */
export type E2EPaymentData = {
  discountCode?: string;
  cardNumber?: string;
  cardName?: string;
  cardExpiryMonth?: string;
  cardExpiryYear?: string;
};

/** Top-level shape for ui/ journey files. */
export type E2ETestData = {
  items?: string[];
  payment?: E2EPaymentData;
};
