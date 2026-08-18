import type { CartLine } from '../../src/domain/types.js';

// ─── Cards ───────────────────────────────────────────────────────────────────

export type CardData = {
  cardNumber: string;
  cardName: string;
  cardExpiryMonth: number;
  cardExpiryYear: number;
};

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key} — set DOTENV_KEY and run: npm test`);
  return val;
}

const C_NAME    = requireEnv('TEST_CARD_NAME');
const C_MONTH   = Number(requireEnv('TEST_CARD_EXPIRY_MONTH'));
const C_YEAR    = Number(requireEnv('TEST_CARD_EXPIRY_YEAR'));
const C_SUCCESS = requireEnv('TEST_CARD_NUMBER_SUCCESS');
const C_ALT     = requireEnv('TEST_CARD_NUMBER_ALT_SUCCESS');
const C_DECLINE = requireEnv('TEST_CARD_NUMBER_DECLINED');
const C_ZERO    = requireEnv('TEST_CARD_NUMBER_ZERO_ENDING');

export const CARDS = {
  // Success paths
  valid:             { cardNumber: C_SUCCESS, cardName: C_NAME, cardExpiryMonth: C_MONTH, cardExpiryYear: C_YEAR },
  altSuccess:        { cardNumber: C_ALT,     cardName: C_NAME, cardExpiryMonth: C_MONTH, cardExpiryYear: C_YEAR },
  zeroEndingSuccess: { cardNumber: C_ZERO,    cardName: C_NAME, cardExpiryMonth: C_MONTH, cardExpiryYear: C_YEAR }, // digit 0 is even → success boundary
  minValidName:      { cardNumber: C_SUCCESS, cardName: 'Jo',   cardExpiryMonth: C_MONTH, cardExpiryYear: C_YEAR }, // 2-char name = minimum valid

  // Payment declined (card number issues — numbers are the test condition, kept hardcoded)
  declined:          { cardNumber: C_DECLINE,             cardName: C_NAME, cardExpiryMonth: C_MONTH, cardExpiryYear: C_YEAR },
  spacedOddNumber:   { cardNumber: '4111 1111 1111 1111', cardName: C_NAME, cardExpiryMonth: C_MONTH, cardExpiryYear: C_YEAR },
  shortNumber:       { cardNumber: '123456789012345',     cardName: C_NAME, cardExpiryMonth: C_MONTH, cardExpiryYear: C_YEAR }, // 15 digits
  longNumber:        { cardNumber: '41111111111111122',   cardName: C_NAME, cardExpiryMonth: C_MONTH, cardExpiryYear: C_YEAR }, // 17 digits
  alphaInNumber:     { cardNumber: '4111111111111abc',   cardName: C_NAME, cardExpiryMonth: C_MONTH, cardExpiryYear: C_YEAR }, // letters → not 16 digits

  // Invalid card (rejected before payment — the invalid field value is the test condition)
  expired:           { cardNumber: C_SUCCESS, cardName: C_NAME,  cardExpiryMonth: 1,       cardExpiryYear: 2020    },
  blankName:         { cardNumber: C_SUCCESS, cardName: '',       cardExpiryMonth: C_MONTH, cardExpiryYear: C_YEAR  },
  singleCharName:    { cardNumber: C_SUCCESS, cardName: 'a',      cardExpiryMonth: C_MONTH, cardExpiryYear: C_YEAR  },
  twoSpacesName:     { cardNumber: C_SUCCESS, cardName: '  ',     cardExpiryMonth: C_MONTH, cardExpiryYear: C_YEAR  },
  threeSpacesName:   { cardNumber: C_SUCCESS, cardName: '   ',    cardExpiryMonth: C_MONTH, cardExpiryYear: C_YEAR  },
  twoDigitYear:      { cardNumber: C_SUCCESS, cardName: C_NAME,   cardExpiryMonth: C_MONTH, cardExpiryYear: 30      },
  threeDigitYear:    { cardNumber: C_SUCCESS, cardName: C_NAME,   cardExpiryMonth: C_MONTH, cardExpiryYear: 999     }, // 3 digits, not 4
  expiryMonth0:      { cardNumber: C_SUCCESS, cardName: C_NAME,   cardExpiryMonth: 0,       cardExpiryYear: C_YEAR  }, // below min (1)
  expiryMonth13:     { cardNumber: C_SUCCESS, cardName: C_NAME,   cardExpiryMonth: 13,      cardExpiryYear: C_YEAR  }, // above max (12)

  // Structurally incomplete (missing required fields)
  missingFields:     { cardNumber: C_SUCCESS },
} satisfies Record<string, Partial<CardData>>;

// ─── Carts ───────────────────────────────────────────────────────────────────

export type CartData = { cart: CartLine[] };

export const CARTS: Record<string, CartData> = {
  // Valid carts
  empty:                { cart: [] },
  burgerX1:             { cart: [{ itemId: 'burger', quantity: 1 }] },
  burgerX2:             { cart: [{ itemId: 'burger', quantity: 2 }] },
  burgerAndFries:       { cart: [{ itemId: 'burger', quantity: 1 }, { itemId: 'fries', quantity: 1 }] },
  friesOnly:            { cart: [{ itemId: 'fries',  quantity: 1 }] },
  shakeOnly:            { cart: [{ itemId: 'shake',  quantity: 1 }] },
  saladOnly:            { cart: [{ itemId: 'salad',  quantity: 1 }] },
  twoSalads:            { cart: [{ itemId: 'salad',  quantity: 2 }] },
  allFourItems:         { cart: [{ itemId: 'burger', quantity: 1 }, { itemId: 'fries', quantity: 1 }, { itemId: 'shake', quantity: 1 }, { itemId: 'salad', quantity: 1 }] }, // subtotal: 2146p

  // Stock boundaries (seed: burger=10, fries=20, shake=8, salad=5)
  burgerAtStock:        { cart: [{ itemId: 'burger', quantity: 10 }] }, // exact limit → success
  burgerOverStock:      { cart: [{ itemId: 'burger', quantity: 11 }] }, // limit + 1 → INSUFFICIENT_STOCK
  saladAtStock:         { cart: [{ itemId: 'salad',  quantity: 5  }] }, // exact limit → success
  saladInsufficient:    { cart: [{ itemId: 'salad',  quantity: 99 }] },

  // Invalid quantity
  zeroQuantity:         { cart: [{ itemId: 'fries',  quantity: 0   }] },
  negativeQuantity:     { cart: [{ itemId: 'fries',  quantity: -1  }] }, // → INVALID_QUANTITY
  floatQuantity:        { cart: [{ itemId: 'burger', quantity: 1.5 }] },
  mixedZeroQty:         { cart: [{ itemId: 'burger', quantity: 1 }, { itemId: 'fries', quantity: 0 }] },

  // Unknown / case-sensitive item IDs
  unknownItem:          { cart: [{ itemId: 'pizza',  quantity: 1 }] },
  uppercaseItem:        { cart: [{ itemId: 'Burger', quantity: 1 }] },

  // Duplicate lines: stock is validated per-line before deduction, so both lines pass
  // individually (10 >= 1, 10 >= 1) and deduct sequentially (10 → 9 → 8)
  duplicateBurgerLines: { cart: [{ itemId: 'burger', quantity: 1 }, { itemId: 'burger', quantity: 1 }] },
};

// ─── Discounts ───────────────────────────────────────────────────────────────

export const DISCOUNTS = {
  // Valid codes
  save10:            { discountCode: 'SAVE10' },
  mealdeal:          { discountCode: 'MEALDEAL' },
  freeship:          { discountCode: 'FREESHIP' },

  // Case sensitivity — all must be exact uppercase
  lowercaseMealdeal: { discountCode: 'mealdeal' },
  lowercaseSave10:   { discountCode: 'save10'   }, // → INVALID_DISCOUNT
  lowercaseFreeship: { discountCode: 'freeship' }, // → INVALID_DISCOUNT

  // Unknown codes
  unknown:           { discountCode: 'HALFOFF' }, // → INVALID_DISCOUNT "Unknown discount code: HALFOFF"
  whitespaceCode:    { discountCode: '   '     }, // truthy but not in VALID_CODES → INVALID_DISCOUNT

  // Empty string: falsy → isValidDiscountCode returns true; calculateDiscountPence returns 0
  // The order succeeds — empty string is treated as "no discount code provided"
  emptyString:       { discountCode: '' },

  // FREESHIP subtotal boundaries (for calculateDiscountPence unit tests)
  freeshipBoundary:  { subtotalPence: 1000, discountCode: 'FREESHIP' }, // exactly 1000p → succeeds
  freeshipJustBelow: { subtotalPence: 999,  discountCode: 'FREESHIP' }, // 999p → INVALID_DISCOUNT

  // Extra unknown fields (API must strip silently, not reject)
  save10UnknownField: { discountCode: 'SAVE10', unknownField: 'should-be-ignored' },
};

// ─── Stock ───────────────────────────────────────────────────────────────────

export const STOCK = {
  salad:    { itemId: 'salad' },
  fries:    { itemId: 'fries' },
  shake:    { itemId: 'shake' },
  burger:   { itemId: 'burger', checkEnabledItemId: 'salad' },
  multiItem:{ drainItemId: 'salad', secondItemId: 'burger', secondItemQuantity: 1 },
};

// ─── Schema fixtures ─────────────────────────────────────────────────────────

export const SCHEMA_FIXTURES = {
  // Menu: valid shapes
  menuResponse: {
    items: [{ id: 'burger', name: 'Classic Burger', pricePence: 899, stock: 10 }],
  },
  menuZeroStock: {
    items: [{ id: 'fries', name: 'Fries', pricePence: 299, stock: 0 }], // 0 is nonnegative → valid
  },

  // Menu: invalid shapes
  menuNegativeStock: {
    items: [{ id: 'x', name: 'X', pricePence: 100, stock: -1  }],
  },
  menuNegativePrice: {
    items: [{ id: 'x', name: 'X', pricePence: -1,  stock: 5   }], // pricePence must be nonnegative
  },
  menuFloatStock: {
    items: [{ id: 'x', name: 'X', pricePence: 100, stock: 1.5 }], // stock must be integer
  },

  // Order response envelopes: success
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

  // Order response envelopes: failure (one per error code used in contract tests)
  failureEnvelope: {
    ok: false,
    error: 'PAYMENT_DECLINED',
    message: 'Payment declined by issuer',
  },
  failureEnvelopeEmptyCart: {
    ok: false,
    error: 'EMPTY_CART',
    message: 'Cart is empty',
  },
  failureEnvelopeUnknownItem: {
    ok: false,
    error: 'UNKNOWN_ITEM',
    message: 'Unknown item: pizza',
  },
};
