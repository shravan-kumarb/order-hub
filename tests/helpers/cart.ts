import type { CartLine } from '../../src/domain/types.js';

export const cartItem = (itemId: string, quantity = 1): CartLine => ({ itemId, quantity });
