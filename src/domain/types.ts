export interface MenuItem {
  id: string;
  name: string;
  pricePence: number;
  stock: number;
}

export interface CartLine {
  itemId: string;
  quantity: number;
}

export type DiscountCode = 'SAVE10' | 'MEALDEAL' | 'FREESHIP';

export interface OrderRequest {
  cart: CartLine[];
  discountCode?: string;
  /** Exactly 16 digits; even last digit → success; odd → decline */
  cardNumber: string;
  /** Cardholder name — mandatory */
  cardName: string;
  /** Expiry month 1–12 — mandatory; must be current or future with year */
  cardExpiryMonth: number;
  /** Expiry year (YYYY) — mandatory; must be current or future with month */
  cardExpiryYear: number;
}

export interface OrderLineResult {
  itemId: string;
  name: string;
  quantity: number;
  unitPricePence: number;
  lineTotalPence: number;
}

export interface OrderSuccess {
  ok: true;
  orderId: string;
  lines: OrderLineResult[];
  subtotalPence: number;
  discountPence: number;
  totalPence: number;
  paymentStatus: 'paid';
  remainingStock: Record<string, number>;
}

export interface OrderFailure {
  ok: false;
  error:
    | 'EMPTY_CART'
    | 'UNKNOWN_ITEM'
    | 'INVALID_QUANTITY'
    | 'INSUFFICIENT_STOCK'
    | 'INVALID_DISCOUNT'
    | 'INVALID_CARD'
    | 'PAYMENT_DECLINED';
  message: string;
}

export type OrderResult = OrderSuccess | OrderFailure;
