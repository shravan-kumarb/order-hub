import { calculateDiscountPence, cartSubtotalPence, isValidDiscountCode } from './discount.js';
import { domainError } from './errors.js';
import { findItem } from './menu.js';
import { processPayment } from './payment.js';
import type { CartLine, MenuItem, OrderLineResult, OrderRequest, OrderResult } from './types.js';

let orderSeq = 1;

export function resetOrderSeq(next = 1): void {
  orderSeq = next;
}

function deductStock(menu: MenuItem[], cart: CartLine[]): void {
  for (const line of cart) {
    const item = findItem(menu, line.itemId)!;
    item.stock = Math.max(0, item.stock - line.quantity);
  }
}

function buildOrderLines(menu: MenuItem[], cart: CartLine[]): OrderLineResult[] {
  return cart.map((line) => {
    const item = findItem(menu, line.itemId)!;
    return {
      itemId: item.id,
      name: item.name,
      quantity: line.quantity,
      unitPricePence: item.pricePence,
      lineTotalPence: item.pricePence * line.quantity,
    };
  });
}

export function placeOrder(menu: MenuItem[], request: OrderRequest): OrderResult {
  const { cart, discountCode, cardNumber } = request;

  if (!cart.length) {
    return domainError('EMPTY_CART', 'Cart is empty');
  }

  for (const line of cart) {
    if (!Number.isInteger(line.quantity) || line.quantity < 1) {
      return domainError('INVALID_QUANTITY', `Invalid quantity for ${line.itemId}`);
    }
    const item = findItem(menu, line.itemId);
    if (!item) {
      return domainError('UNKNOWN_ITEM', `Unknown item: ${line.itemId}`);
    }
    if (item.stock < line.quantity) {
      return domainError(
        'INSUFFICIENT_STOCK',
        `Not enough stock for ${item.name} (have ${item.stock}, want ${line.quantity})`,
      );
    }
  }

  if (discountCode && !isValidDiscountCode(discountCode)) {
    return domainError('INVALID_DISCOUNT', `Unknown discount code: ${discountCode}`);
  }

  const subtotalPence = cartSubtotalPence(menu, cart);
  const { discountPence, error: discountError } = calculateDiscountPence(
    menu,
    cart,
    subtotalPence,
    discountCode,
  );
  if (discountError) {
    return domainError('INVALID_DISCOUNT', discountError);
  }

  const totalPence = Math.max(0, subtotalPence - discountPence);
  const payment = processPayment({
    cardNumber,
    cardName: request.cardName,
    cardExpiryMonth: request.cardExpiryMonth,
    cardExpiryYear: request.cardExpiryYear,
  });
  if (!payment.success) {
    const reason = payment.reason ?? 'Payment declined';
    const invalidCard =
      reason.includes('name') ||
      reason.includes('Expiry') ||
      reason.includes('expiry') ||
      reason.includes('month') ||
      reason.includes('year');
    return domainError(invalidCard ? 'INVALID_CARD' : 'PAYMENT_DECLINED', reason);
  }

  deductStock(menu, cart);

  const orderId = `ORD-${String(orderSeq++).padStart(4, '0')}`;

  return {
    ok: true,
    orderId,
    lines: buildOrderLines(menu, cart),
    subtotalPence,
    discountPence,
    totalPence,
    paymentStatus: 'paid',
    remainingStock: Object.fromEntries(menu.map((i) => [i.id, i.stock])),
  };
}
