import type { Page } from '@playwright/test';

export type PaymentFormInput = {
  cardName?: string;
  cardNumber?: string;
  cardExpiryMonth?: string;
  cardExpiryYear?: string;
  discountCode?: string;
};

/** Fill checkout payment fields used by the takeaway UI. */
export async function fillPaymentForm(
  page: Page,
  {
    cardName = 'Test User',
    cardNumber = '4111111111111112',
    cardExpiryMonth = '12',
    cardExpiryYear = String(new Date().getFullYear() + 5),
    discountCode,
  }: PaymentFormInput = {},
): Promise<void> {
  if (discountCode !== undefined) {
    await page.getByTestId('input-discount').fill(discountCode);
  }
  await page.getByTestId('input-card-name').fill(cardName);
  await page.getByTestId('input-card-number').fill(cardNumber);
  await page.getByTestId('input-card-month').fill(cardExpiryMonth);
  await page.getByTestId('input-card-year').fill(cardExpiryYear);
}

export async function placeOrder(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Place order' }).click();
}

export async function submitOrder(page: Page, options?: PaymentFormInput): Promise<void> {
  await fillPaymentForm(page, options);
  await placeOrder(page);
}
