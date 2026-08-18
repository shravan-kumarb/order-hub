import { expect, test, API_URL } from './fixtures.js';
import { OrderPage } from './pages/OrderPage.js';
import { UI_JOURNEYS, UI_SPECIALS } from '../data/e2eTestData.js';

test.describe('Takeaway ordering UI', () => {
  test.beforeEach(async ({ request }) => {
    const res = await request.post(`${API_URL}/api/test/reset`);
    expect(res.ok()).toBeTruthy();
  });

  test('happy path: add items, apply SAVE10, pay successfully', async ({ page }) => {
    const d = UI_JOURNEYS.happyPath;
    const order = new OrderPage(page);

    await test.step('load page and verify menu visible', async () => {
      await order.goto();
      await expect(order.heading()).toBeVisible();
      await expect(order.stockBadge(d.items[0])).toContainText('Stock:');
    });

    await test.step('add burger and fries to cart', async () => {
      for (const item of d.items) {
        await order.addButton(item).click();
      }
      await expect(order.cartLine(d.items[0])).toBeVisible();
    });

    await test.step('fill payment form with SAVE10 and place order', async () => {
      await order.pay(d.payment);
    });

    await test.step('verify paid status with order id', async () => {
      await expect(order.status()).toContainText(/Order ORD-/);
      await expect(order.status()).toContainText(/paid/);
    });
  });

  test('shows payment decline without clearing the cart', async ({ page }) => {
    const d = UI_JOURNEYS.declinedCard;
    const order = new OrderPage(page);
    await order.goto();
    for (const item of d.items) {
      await order.addButton(item).click();
    }
    await order.pay(d.payment);
    await expect(order.status()).toContainText(/declined/i);
    await expect(order.cartLine(d.items[0])).toBeVisible();
  });

  test('menu stock updates after a successful order', async ({ page }) => {
    const d = UI_JOURNEYS.stockUpdate;
    const order = new OrderPage(page);
    await order.goto();
    const before = await order.stockBadge(d.items[0]).innerText();
    const beforeQty = Number(before.replace(/\D/g, ''));
    for (const item of d.items) {
      await order.addButton(item).click();
    }
    await order.pay(d.payment);
    await expect(order.status()).toContainText(/paid/);
    await expect(order.stockBadge(d.items[0])).toContainText(String(beforeQty - 1));
  });

  test('requires cardholder name', async ({ page }) => {
    const d = UI_JOURNEYS.blankName;
    const order = new OrderPage(page);
    await order.goto();
    for (const item of d.items) {
      await order.addButton(item).click();
    }
    await order.pay(d.payment);
    await expect(order.status()).toContainText(/Cardholder name is required/i);
    await expect(order.cartLine(d.items[0])).toBeVisible();
  });

  test('rejects two-digit expiry year with clear message', async ({ page }) => {
    const d = UI_JOURNEYS.twoDigitYear;
    const order = new OrderPage(page);
    await order.goto();
    for (const item of d.items) {
      await order.addButton(item).click();
    }
    await order.pay(d.payment);
    await expect(order.status()).toContainText(/Expiry year should be four digits/i);
  });

  test('rejects expired card', async ({ page }) => {
    const d = UI_JOURNEYS.expiredCard;
    const order = new OrderPage(page);
    await order.goto();
    for (const item of d.items) {
      await order.addButton(item).click();
    }
    await order.pay(d.payment);
    await expect(order.status()).toContainText(/future date/i);
  });

  test('rejects non-16-digit card number', async ({ page }) => {
    const d = UI_JOURNEYS.shortCardNumber;
    const order = new OrderPage(page);
    await order.goto();
    for (const item of d.items) {
      await order.addButton(item).click();
    }
    await order.pay(d.payment);
    await expect(order.status()).toContainText(/Card number must be 16 digits/i);
  });

  test('requires items in cart before checkout', async ({ page }) => {
    const d = UI_JOURNEYS.emptyCart;
    const order = new OrderPage(page);
    await order.goto();
    await order.pay(d.payment);
    await expect(order.status()).toContainText(/Cart must contain at least one item/i);
  });

  test('applies MEALDEAL discount when burger and fries are in cart', async ({ page }) => {
    const d = UI_JOURNEYS.mealdealDiscount;
    const order = new OrderPage(page);
    await order.goto();
    for (const item of d.items) {
      await order.addButton(item).click();
    }
    await order.pay(d.payment);
    await expect(order.status()).toContainText(/Order ORD-/);
    await expect(order.status()).toContainText(/saved £2\.00/);
  });

  test('applies FREESHIP discount when subtotal reaches £10', async ({ page }) => {
    const d = UI_JOURNEYS.freeshipDiscount;
    const order = new OrderPage(page);
    await order.goto();
    // burger (899p) + fries (299p) = 1198p >= 1000p minimum for FREESHIP
    for (const item of d.items) {
      await order.addButton(item).click();
    }
    await order.pay(d.payment);
    await expect(order.status()).toContainText(/Order ORD-/);
    await expect(order.status()).toContainText(/saved £1\.50/);
  });

  test('"Cart is empty" shown initially and hidden once an item is added', async ({ page }) => {
    const d = UI_JOURNEYS.cartEmptyVisibility;
    const order = new OrderPage(page);
    await order.goto();
    await expect(order.cartEmpty()).toBeVisible();
    await order.addButton(d.items[0]).click();
    await expect(order.cartEmpty()).toBeHidden();
  });

  test('Add button is disabled when item stock is exhausted', async ({ page, request, drainStock }) => {
    const d = UI_SPECIALS.drainSalad;
    const order = new OrderPage(page);
    const menuRes = await request.get(`${API_URL}/api/menu`);
    const { items } = await menuRes.json() as { items: Array<{ id: string; stock: number }> };
    const itemStock = items.find((i) => i.id === d.drainItemId)!.stock;
    await drainStock(d.drainItemId, itemStock);
    await order.goto();
    await expect(order.addButton(d.drainItemId)).toBeDisabled();
  });

  test('shows correct quantity and line total for multiple of the same item', async ({ page, request }) => {
    const d = UI_SPECIALS.tripleBurger;
    const order = new OrderPage(page);
    const menu = await request.get(`${API_URL}/api/menu`);
    const { items } = await menu.json() as { items: Array<{ id: string; pricePence: number }> };
    const pricePence = items.find((i) => i.id === d.itemId)!.pricePence;
    const expectedTotal = `£${((pricePence * d.addCount) / 100).toFixed(2)}`;

    await order.goto();
    for (let i = 0; i < d.addCount; i++) {
      await order.addButton(d.itemId).click();
    }

    await expect(order.cartLine(d.itemId)).toContainText(`× ${d.addCount}`);
    await expect(order.cartLine(d.itemId)).toContainText(expectedTotal);
  });

  test('MEALDEAL rejected when cart does not contain both burger and fries', async ({ page }) => {
    const d = UI_JOURNEYS.mealdealRejected;
    const order = new OrderPage(page);
    await order.goto();
    for (const item of d.items) {
      await order.addButton(item).click();
    }
    await order.pay(d.payment);
    await expect(order.status()).toContainText(/MEALDEAL requires a burger and fries/i);
  });

  test('FREESHIP rejected when subtotal is below £10', async ({ page }) => {
    const d = UI_JOURNEYS.freeshipRejected;
    const order = new OrderPage(page);
    await order.goto();
    for (const item of d.items) {
      await order.addButton(item).click();
    }
    await order.pay(d.payment);
    await expect(order.status()).toContainText(/FREESHIP requires a subtotal of at least £10/i);
  });

  test('FREESHIP succeeds when subtotal is at the minimum qualifying threshold', async ({ page }) => {
    const d = UI_JOURNEYS.freeshipThreshold;
    const order = new OrderPage(page);
    await order.goto();
    // salad (549p) × 2 = 1098p — nearest achievable UI total to the 1000p FREESHIP boundary.
    // Exact 1000p is not reachable with current menu prices; unit-layer covers the exact boundary.
    for (const item of d.items) {
      await order.addButton(item).click();
    }
    await order.pay(d.payment);
    await expect(order.status()).toContainText(/Order ORD-/);
    await expect(order.status()).toContainText(/saved £1\.50/);
  });

  test('Add button is disabled on initial page load when item stock is zero', async ({ page, request, drainStock }) => {
    const d = UI_SPECIALS.drainBurger;
    const order = new OrderPage(page);
    const menuRes = await request.get(`${API_URL}/api/menu`);
    const { items } = await menuRes.json() as { items: Array<{ id: string; stock: number }> };
    const burgerStock = items.find((i) => i.id === d.drainItemId)!.stock;
    await drainStock(d.drainItemId, burgerStock); // exhaust all seed units before the page loads
    await order.goto();
    // Must be disabled from the first render — not only after a client-side stock-change event.
    await expect(order.addButton(d.drainItemId)).toBeDisabled();
    // Salad stock is untouched — confirms the disabled state is item-specific.
    await expect(order.addButton(d.checkEnabledItemId)).not.toBeDisabled();
  });

  test('page reload after paid order resets cart and clears status', async ({ page }) => {
    const d = UI_JOURNEYS.pageReload;
    const order = new OrderPage(page);
    await order.goto();
    for (const item of d.items) {
      await order.addButton(item).click();
    }
    await order.pay(d.payment);
    await expect(order.status()).toContainText(/paid/);
    await page.reload();
    await expect(order.status()).toBeEmpty();
    await expect(order.cartEmpty()).toBeVisible();
    await expect(order.cartLine(d.items[0])).not.toBeVisible();
  });

  // AI[order-total-e2e] pass-2 promoted: pence-to-currency formatting only verifiable in real browser
  test('status shows correct order total in currency format', async ({ page }) => {
    const d = UI_JOURNEYS.orderTotalFormat;
    const order = new OrderPage(page);

    await test.step('load page', async () => {
      await order.goto();
    });

    await test.step('add burger (899p) and fries (299p) to cart', async () => {
      for (const item of d.items) {
        await order.addButton(item).click();
      }
    });

    await test.step('fill payment form and place order', async () => {
      await order.pay(d.payment);
    });

    await test.step('verify paid status and total £11.98 (1198p formatted correctly)', async () => {
      await expect(order.status()).toContainText(/paid/);
      await expect(order.status()).toContainText(d.expectedTotal!);
    });
  });
});
