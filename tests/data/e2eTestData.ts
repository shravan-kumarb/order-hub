function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key} — set DOTENV_KEY and run: npm run test:e2e`);
  return val;
}

// Card numbers loaded from encrypted .env.enc — no credentials in source
const C_ALT     = requireEnv('TEST_CARD_NUMBER_ALT_SUCCESS');
const C_DECLINE = requireEnv('TEST_CARD_NUMBER_DECLINED');

/** Partial overrides for the payment form. All fields are strings because they fill HTML inputs. */
export type E2EPaymentData = {
  discountCode?: string;
  cardNumber?: string;
  cardName?: string;
  cardExpiryMonth?: string;
  cardExpiryYear?: string;
};

/** Journey: items to add (button click sequence) + optional payment form overrides. */
export type E2EJourney = {
  items: string[];
  payment?: E2EPaymentData;
};

/** Standard ordering journeys — one entry per E2E test scenario. */
export const UI_JOURNEYS: Record<string, E2EJourney & { expectedTotal?: string }> = {
  // Happy paths
  happyPath:           { items: ['burger', 'fries'], payment: { discountCode: 'SAVE10'    } },
  mealdealDiscount:    { items: ['burger', 'fries'], payment: { discountCode: 'MEALDEAL'  } },
  freeshipDiscount:    { items: ['burger', 'fries'], payment: { discountCode: 'FREESHIP'  } },
  freeshipThreshold:   { items: ['salad',  'salad'], payment: { discountCode: 'FREESHIP'  } }, // 549×2 = 1098p ≥ 1000p
  stockUpdate:         { items: ['salad'],           payment: { cardNumber: C_ALT     } },

  // Payment error paths
  declinedCard:        { items: ['shake'],           payment: { cardNumber: C_DECLINE } },
  blankName:           { items: ['burger'],          payment: { cardName: ''                  } },
  twoDigitYear:        { items: ['fries'],           payment: { cardExpiryYear: '30'           } },
  expiredCard:         { items: ['burger'],          payment: { cardExpiryMonth: '1', cardExpiryYear: '2020' } },
  shortCardNumber:     { items: ['burger'],          payment: { cardNumber: '1234567890'       } },

  // Discount error paths
  mealdealRejected:    { items: ['shake'],           payment: { discountCode: 'MEALDEAL'  } }, // no burger+fries
  freeshipRejected:    { items: ['fries'],           payment: { discountCode: 'FREESHIP'  } }, // 299p < 1000p
  unknownDiscount:     { items: ['burger', 'fries'], payment: { discountCode: 'HALFOFF'   } }, // unrecognised code

  // Cart error paths
  emptyCart:           { items: [],                 payment: {} },

  // UI / display verification
  cartEmptyVisibility: { items: ['burger']                                                   }, // no payment — visual check only
  orderTotalFormat:    { items: ['burger', 'fries'], payment: {}, expectedTotal: '£11.98'    }, // 1198p formatted correctly
  pageReload:          { items: ['burger'],          payment: {}                              },
};

/** Non-journey E2E scenarios: stock drain targets and multi-add interactions. */
export const UI_SPECIALS = {
  tripleBurger: { itemId: 'burger', addCount: 3 },
  drainSalad:   { drainItemId: 'salad' },
  drainBurger:  { drainItemId: 'burger', checkEnabledItemId: 'salad' },
};
