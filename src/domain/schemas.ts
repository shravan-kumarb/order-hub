import { z } from 'zod';

/** Contract source of truth — shared by API validation and contract tests. */
export const MenuItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  pricePence: z.number().int().nonnegative(),
  stock: z.number().int().nonnegative(),
});

export const CartLineSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().positive(),
});

function isCurrentOrFutureExpiry(month: number, year: number, now = new Date()): boolean {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  return year > currentYear || (year === currentYear && month >= currentMonth);
}

export const OrderRequestSchema = z
  .object({
    cart: z.array(CartLineSchema).min(1, {
      message: 'Cart must contain at least one item',
    }),
    discountCode: z.string().optional(),
    cardNumber: z.string().min(1, { message: 'Card number is required' }),
    cardName: z
      .string({ required_error: 'Cardholder name is required' })
      .trim()
      .min(2, { message: 'Cardholder name is required' }),
    cardExpiryMonth: z.coerce
      .number({ required_error: 'Expiry month is required' })
      .int()
      .min(1, { message: 'Expiry month must be between 1 and 12' })
      .max(12, { message: 'Expiry month must be between 1 and 12' }),
    cardExpiryYear: z
      .union([z.string(), z.number()], {
        required_error: 'Expiry year is required',
        invalid_type_error: 'Expiry year is required',
      })
      .transform((value) => String(value).trim())
      .superRefine((value, ctx) => {
        if (!value) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Expiry year is required',
          });
          return;
        }
        if (!/^\d{4}$/.test(value)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Expiry year should be four digits',
          });
        }
      })
      .transform((value) => Number(value)),
  })
  .superRefine((data, ctx) => {
    if (
      Number.isFinite(data.cardExpiryMonth) &&
      Number.isFinite(data.cardExpiryYear) &&
      !isCurrentOrFutureExpiry(data.cardExpiryMonth, data.cardExpiryYear)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cardExpiryYear'],
        message: 'Card expiry must be a future date',
      });
    }
  });

export const OrderSuccessSchema = z.object({
  ok: z.literal(true),
  orderId: z.string(),
  lines: z.array(
    z.object({
      itemId: z.string(),
      name: z.string(),
      quantity: z.number().int().positive(),
      unitPricePence: z.number().int().nonnegative(),
      lineTotalPence: z.number().int().nonnegative(),
    }),
  ),
  subtotalPence: z.number().int().nonnegative(),
  discountPence: z.number().int().nonnegative(),
  totalPence: z.number().int().nonnegative(),
  paymentStatus: z.literal('paid'),
  remainingStock: z.record(z.string(), z.number().int().nonnegative()),
});

export const OrderFailureSchema = z.object({
  ok: z.literal(false),
  error: z.enum([
    'EMPTY_CART',
    'UNKNOWN_ITEM',
    'INVALID_QUANTITY',
    'INSUFFICIENT_STOCK',
    'INVALID_DISCOUNT',
    'INVALID_CARD',
    'PAYMENT_DECLINED',
  ]),
  message: z.string(),
});

export const OrderResultSchema = z.union([OrderSuccessSchema, OrderFailureSchema]);
export const MenuResponseSchema = z.object({
  items: z.array(MenuItemSchema),
});
