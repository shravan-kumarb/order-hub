export const STOCK = {
  salad:    { itemId: 'salad' },
  fries:    { itemId: 'fries' },
  burger:   { itemId: 'burger', checkEnabledItemId: 'salad' },
  multiItem:{ drainItemId: 'salad', secondItemId: 'burger', secondItemQuantity: 1 },
};
