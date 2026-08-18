import type { CartLine } from '../../src/domain/types.js';

export type CartData = { cart: CartLine[] };

export const CARTS: Record<string, CartData> = {
  empty:             { cart: [] },
  burgerX1:          { cart: [{ itemId: 'burger', quantity: 1 }] },
  burgerX2:          { cart: [{ itemId: 'burger', quantity: 2 }] },
  burgerAndFries:    { cart: [{ itemId: 'burger', quantity: 1 }, { itemId: 'fries', quantity: 1 }] },
  friesOnly:         { cart: [{ itemId: 'fries',  quantity: 1 }] },
  shakeOnly:         { cart: [{ itemId: 'shake',  quantity: 1 }] },
  saladOnly:         { cart: [{ itemId: 'salad',  quantity: 1 }] },
  twoSalads:         { cart: [{ itemId: 'salad',  quantity: 2 }] },
  zeroQuantity:      { cart: [{ itemId: 'fries',  quantity: 0 }] },
  floatQuantity:     { cart: [{ itemId: 'burger', quantity: 1.5 }] },
  unknownItem:       { cart: [{ itemId: 'pizza',  quantity: 1 }] },
  mixedZeroQty:      { cart: [{ itemId: 'burger', quantity: 1 }, { itemId: 'fries', quantity: 0 }] },
  uppercaseItem:     { cart: [{ itemId: 'Burger', quantity: 1 }] },
  saladInsufficient: { cart: [{ itemId: 'salad',  quantity: 99 }] },
};
