import { test as base, expect } from '@playwright/test';
import { validCard } from '../helpers/card.js';
import { cartItem } from '../helpers/cart.js';

export { expect };

/** Derived from the same PORT env var that playwright.config.ts passes to the API webServer. */
export const API_URL = `http://127.0.0.1:${process.env.PORT ?? '3001'}`;

export const test = base.extend<{
  drainStock: (itemId: string, quantity: number) => Promise<void>;
}>({
  drainStock: async ({ request }, use) => {
    await use(async (itemId: string, quantity: number) => {
      const res = await request.post(`${API_URL}/api/orders`, {
        data: {
          cart: [cartItem(itemId, quantity)],
          ...validCard(),
        },
      });
      expect(res.ok(), `drainStock failed for ${itemId} × ${quantity}: HTTP ${res.status()}`).toBeTruthy();
    });
  },
});
