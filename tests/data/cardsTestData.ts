export type CardData = {
  cardNumber: string;
  cardName: string;
  cardExpiryMonth: number;
  cardExpiryYear: number;
};

export const CARDS = {
  valid:            { cardNumber: '4111111111111112', cardName: 'Test User', cardExpiryMonth: 12, cardExpiryYear: 2040 },
  declined:         { cardNumber: '4111111111111111', cardName: 'Test User', cardExpiryMonth: 12, cardExpiryYear: 2040 },
  altSuccess:       { cardNumber: '4242424242424242', cardName: 'Test User', cardExpiryMonth: 12, cardExpiryYear: 2040 },
  expired:          { cardNumber: '4111111111111112', cardName: 'Test User', cardExpiryMonth: 1,  cardExpiryYear: 2020 },
  blankName:        { cardNumber: '4111111111111112', cardName: '',          cardExpiryMonth: 12, cardExpiryYear: 2040 },
  singleCharName:   { cardNumber: '4111111111111112', cardName: 'a',         cardExpiryMonth: 12, cardExpiryYear: 2040 },
  twoSpacesName:    { cardNumber: '4111111111111112', cardName: '  ',        cardExpiryMonth: 12, cardExpiryYear: 2040 },
  threeSpacesName:  { cardNumber: '4111111111111112', cardName: '   ',       cardExpiryMonth: 12, cardExpiryYear: 2040 },
  twoDigitYear:     { cardNumber: '4111111111111112', cardName: 'Test User', cardExpiryMonth: 12, cardExpiryYear: 30   },
  shortNumber:      { cardNumber: '123456789012345',  cardName: 'Test User', cardExpiryMonth: 12, cardExpiryYear: 2040 },
  spacedOddNumber:  { cardNumber: '4111 1111 1111 1111', cardName: 'Test User', cardExpiryMonth: 12, cardExpiryYear: 2040 },
  missingFields:    { cardNumber: '4111111111111112' },
} satisfies Record<string, Partial<CardData>>;
