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
  happyPath:           { items: ['burger', 'fries'], payment: { discountCode: 'SAVE10' } },
  declinedCard:        { items: ['shake'],           payment: { cardNumber: '4111111111111111' } },
  stockUpdate:         { items: ['salad'],           payment: { cardNumber: '4242424242424242' } },
  blankName:           { items: ['burger'],          payment: { cardName: '' } },
  twoDigitYear:        { items: ['fries'],           payment: { cardExpiryYear: '30' } },
  expiredCard:         { items: ['burger'],          payment: { cardExpiryMonth: '1', cardExpiryYear: '2020' } },
  shortCardNumber:     { items: ['burger'],          payment: { cardNumber: '1234567890' } },
  emptyCart:           { items: [],                 payment: {} },
  mealdealDiscount:    { items: ['burger', 'fries'], payment: { discountCode: 'MEALDEAL' } },
  freeshipDiscount:    { items: ['burger', 'fries'], payment: { discountCode: 'FREESHIP' } },
  cartEmptyVisibility: { items: ['burger'] },
  mealdealRejected:    { items: ['shake'],           payment: { discountCode: 'MEALDEAL' } },
  freeshipRejected:    { items: ['fries'],           payment: { discountCode: 'FREESHIP' } },
  orderTotalFormat:    { items: ['burger', 'fries'], payment: {}, expectedTotal: '£11.98' },
  freeshipThreshold:   { items: ['salad', 'salad'], payment: { discountCode: 'FREESHIP' } },
  pageReload:          { items: ['burger'],          payment: {} },
};

/** Non-journey E2E scenarios: stock drain targets and multi-add interactions. */
export const UI_SPECIALS = {
  tripleBurger: { itemId: 'burger', addCount: 3 },
  drainSalad:   { drainItemId: 'salad' },
  drainBurger:  { drainItemId: 'burger', checkEnabledItemId: 'salad' },
};
