import cors from 'cors';
import express from 'express';
import { domainError } from '../domain/errors.js';
import { placeOrder } from '../domain/order.js';
import { MenuResponseSchema, OrderRequestSchema, OrderResultSchema } from '../domain/schemas.js';
import { getMenu, resetStore } from './store.js';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/menu', (_req, res) => {
    const body = MenuResponseSchema.parse({ items: getMenu() });
    res.json(body);
  });

  app.post('/api/orders', (req, res) => {
    const parsed = OrderRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      const issues = parsed.error.issues;
      const emptyCart = issues.some(
        (i) => i.path.join('.') === 'cart' && i.code === 'too_small',
      );
      const invalidCard = issues.some((i) =>
        ['cardName', 'cardExpiryMonth', 'cardExpiryYear', 'cardNumber'].includes(
          String(i.path[0]),
        ),
      );
      res.status(400).json(
        domainError(
          emptyCart ? 'EMPTY_CART' : invalidCard ? 'INVALID_CARD' : 'INVALID_QUANTITY',
          [...new Set(issues.map((i) => i.message))].join('. '),
        ),
      );
      return;
    }

    const result = placeOrder(getMenu(), parsed.data);
    const validated = OrderResultSchema.parse(result);
    res.status(validated.ok ? 201 : 422).json(validated);
  });

  /** Test-only helper — not for production. */
  app.post('/api/test/reset', (_req, res) => {
    resetStore();
    res.json({ reset: true });
  });

  return app;
}
