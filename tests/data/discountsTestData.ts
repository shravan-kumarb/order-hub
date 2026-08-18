export const DISCOUNTS = {
  save10:            { discountCode: 'SAVE10' },
  mealdeal:          { discountCode: 'MEALDEAL' },
  freeship:          { discountCode: 'FREESHIP' },
  lowercaseMealdeal: { discountCode: 'mealdeal' },
  freeshipBoundary:  { subtotalPence: 1000, discountCode: 'FREESHIP' },
  save10UnknownField:{ discountCode: 'SAVE10', unknownField: 'should-be-ignored' },
};
