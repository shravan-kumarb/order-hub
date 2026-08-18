/** Shape-only fixtures for the Zod contract tests (menu and envelope shapes). */
export const SCHEMA_FIXTURES = {
  menuResponse: {
    items: [{ id: 'burger', name: 'Classic Burger', pricePence: 899, stock: 10 }],
  },
  menuNegativeStock: {
    items: [{ id: 'x', name: 'X', pricePence: 100, stock: -1 }],
  },
  successEnvelope: {
    ok: true,
    orderId: 'ORD-0001',
    lines: [{ itemId: 'burger', name: 'Classic Burger', quantity: 1, unitPricePence: 899, lineTotalPence: 899 }],
    subtotalPence: 899,
    discountPence: 0,
    totalPence: 899,
    paymentStatus: 'paid',
    remainingStock: { burger: 9 },
  },
  failureEnvelope: {
    ok: false,
    error: 'PAYMENT_DECLINED',
    message: 'Payment declined by issuer',
  },
};
