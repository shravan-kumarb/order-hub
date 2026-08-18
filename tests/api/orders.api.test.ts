import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/api/app.js';
import { resetStore } from '../../src/api/store.js';
import { DISCOUNT_AMOUNTS } from '../../src/domain/discount.js';
import { resetOrderSeq } from '../../src/domain/order.js';
import { OrderResultSchema } from '../../src/domain/schemas.js';
import { CARDS, CARTS, DISCOUNTS, STOCK } from '../data/testData.js';

describe('Orders API', () => {
  const app = createApp();

  beforeEach(() => {
    resetStore();
    resetOrderSeq(1);
  });

  it('GET /api/menu returns items with stock', async () => {
    const res = await request(app).get('/api/menu').expect(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.items[0]).toMatchObject({ id: expect.any(String), stock: expect.any(Number), pricePence: expect.any(Number) });
  });

  it('POST /api/orders succeeds and persists stock reduction', async () => {
    const before = await request(app).get('/api/menu');
    const burgerStock = before.body.items.find((i: { id: string }) => i.id === 'burger').stock;

    const res = await request(app).post('/api/orders').send({ ...CARTS.burgerX1, ...CARDS.valid }).expect(201);
    expect(OrderResultSchema.parse(res.body).ok).toBe(true);

    const after = await request(app).get('/api/menu');
    expect(after.body.items.find((i: { id: string }) => i.id === 'burger').stock).toBe(burgerStock - 1);
  });

  it('POST /api/orders returns 422 when payment declines', async () => {
    const res = await request(app).post('/api/orders').send({ ...CARTS.friesOnly, ...CARDS.declined }).expect(422);
    expect(res.body).toMatchObject({ ok: false, error: 'PAYMENT_DECLINED' });
  });

  it('POST /api/orders returns 400 for empty cart', async () => {
    const res = await request(app).post('/api/orders').send({ ...CARTS.empty, ...CARDS.valid }).expect(400);
    expect(res.body).toMatchObject({ ok: false, error: 'EMPTY_CART' });
  });

  it('POST /api/orders returns 400 when card name or expiry missing', async () => {
    const res = await request(app).post('/api/orders').send({ ...CARTS.burgerX1, ...CARDS.missingFields }).expect(400);
    expect(res.body.error).toBe('INVALID_CARD');
  });

  it('POST /api/orders returns 400 when cardholder name is blank', async () => {
    const res = await request(app).post('/api/orders').send({ ...CARTS.burgerX1, ...CARDS.blankName }).expect(400);
    expect(res.body.error).toBe('INVALID_CARD');
    expect(res.body.message).toMatch(/Cardholder name is required/i);
  });

  it('POST /api/orders returns 400 for expired card', async () => {
    const res = await request(app).post('/api/orders').send({ ...CARTS.burgerX1, ...CARDS.expired }).expect(400);
    expect(res.body.error).toBe('INVALID_CARD');
    expect(res.body.message).toMatch(/future date/i);
  });

  it('POST /api/orders returns 400 when expiry year is not four digits', async () => {
    const res = await request(app).post('/api/orders').send({ ...CARTS.burgerX1, ...CARDS.twoDigitYear }).expect(400);
    expect(res.body.error).toBe('INVALID_CARD');
    expect(res.body.message).toBe('Expiry year should be four digits');
  });

  it('POST /api/orders returns 422 PAYMENT_DECLINED when card number is not 16 digits', async () => {
    const res = await request(app).post('/api/orders').send({ ...CARTS.burgerX1, ...CARDS.shortNumber }).expect(422);
    expect(res.body).toMatchObject({ ok: false, error: 'PAYMENT_DECLINED', message: 'Card number must be 16 digits' });
  });

  it('applies MEALDEAL through the HTTP boundary', async () => {
    const menuRes = await request(app).get('/api/menu');
    const prices = Object.fromEntries(
      menuRes.body.items.map((i: { id: string; pricePence: number }) => [i.id, i.pricePence]),
    );
    const res = await request(app).post('/api/orders').send({ ...CARTS.burgerAndFries, ...CARDS.altSuccess, ...DISCOUNTS.mealdeal }).expect(201);
    expect(res.body.discountPence).toBe(DISCOUNT_AMOUNTS.MEALDEAL_PENCE);
    expect(res.body.totalPence).toBe(prices.burger + prices.fries - DISCOUNT_AMOUNTS.MEALDEAL_PENCE);
  });

  // AI[freeship-rejected-api] pass-2 promoted: eligibility must be enforced at the HTTP boundary
  it('FREESHIP rejected via HTTP when cart subtotal is below £10', async () => {
    // fries (299p) — below the 1000p minimum
    const res = await request(app).post('/api/orders').send({ ...CARTS.friesOnly, ...CARDS.valid, ...DISCOUNTS.freeship }).expect(422);
    expect(res.body).toMatchObject({ ok: false, error: 'INVALID_DISCOUNT' });
    expect(res.body.message).toMatch(/at least £10/i);
  });

  // AI[unknown-item-api] pass-2 promoted: domain errors must surface as 422, not an unhandled 500
  it('returns 422 UNKNOWN_ITEM for an unrecognised item id', async () => {
    const res = await request(app).post('/api/orders').send({ ...CARTS.unknownItem, ...CARDS.valid }).expect(422);
    expect(res.body).toMatchObject({ ok: false, error: 'UNKNOWN_ITEM' });
  });

  it('returns 400 INVALID_QUANTITY for a mixed cart where one line has quantity zero', async () => {
    const res = await request(app).post('/api/orders').send({ ...CARTS.mixedZeroQty, ...CARDS.valid }).expect(400);
    expect(res.body).toMatchObject({ ok: false, error: 'INVALID_QUANTITY' });
  });

  it('silently strips unknown request fields and processes the order normally', async () => {
    const res = await request(app).post('/api/orders').send({ ...CARTS.burgerX1, ...CARDS.altSuccess, ...DISCOUNTS.save10UnknownField }).expect(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.discountPence).toBe(89); // SAVE10 applied; unknown field stripped, not rejected
  });

  it('returns 400 INVALID_QUANTITY when a cart line has a float quantity', async () => {
    const res = await request(app).post('/api/orders').send({ ...CARTS.floatQuantity, ...CARDS.valid }).expect(400);
    expect(res.body).toMatchObject({ ok: false, error: 'INVALID_QUANTITY' });
  });

  it('GET /api/menu returns stock 0 (not negative) after all units of an item are sold', async () => {
    const menuRes = await request(app).get('/api/menu');
    const friesStock: number = menuRes.body.items.find((i: { id: string }) => i.id === STOCK.fries.itemId).stock;

    await request(app)
      .post('/api/orders')
      .send({ cart: [{ itemId: STOCK.fries.itemId, quantity: friesStock }], ...CARDS.valid })
      .expect(201);

    const after = await request(app).get('/api/menu').expect(200);
    const finalStock: number = after.body.items.find((i: { id: string }) => i.id === STOCK.fries.itemId).stock;
    expect(finalStock).toBe(0);
    expect(finalStock).not.toBeLessThan(0);
  });

  it('concurrent orders do not oversell: exactly as many succeed as there is stock', async () => {
    const menuRes = await request(app).get('/api/menu');
    const SALAD_STOCK: number = menuRes.body.items.find((i: { id: string }) => i.id === STOCK.salad.itemId).stock;

    // Promise.all fires all requests at once; Node.js processes them one at a time in
    // the event loop. This asserts the synchronous in-memory store never goes negative.
    const responses = await Promise.all(
      Array.from({ length: SALAD_STOCK + 1 }, () =>
        request(app).post('/api/orders').send({ cart: [{ itemId: STOCK.salad.itemId, quantity: 1 }], ...CARDS.valid }),
      ),
    );

    expect(responses.filter((r) => r.status === 201)).toHaveLength(SALAD_STOCK);
    expect(responses.filter((r) => r.status === 422 && r.body.error === 'INSUFFICIENT_STOCK')).toHaveLength(1);

    const menu = await request(app).get('/api/menu');
    expect(menu.body.items.find((i: { id: string }) => i.id === STOCK.salad.itemId).stock).toBe(0);
  });
});
