import type { Page } from '@playwright/test';
import { submitOrder, type PaymentFormInput } from '../helpers.js';

export class OrderPage {
  constructor(private readonly page: Page) {}

  async goto() { await this.page.goto('/'); }

  heading()               { return this.page.getByRole('heading', { name: 'Order takeaway' }); }
  addButton(item: string) { return this.page.getByTestId(`add-${item}`); }
  stockBadge(item: string){ return this.page.getByTestId(`stock-${item}`); }
  cartLine(item: string)  { return this.page.getByTestId(`cart-${item}`); }
  cartEmpty()             { return this.page.getByTestId('cart-empty'); }
  status()                { return this.page.getByRole('status'); }

  async pay(opts?: PaymentFormInput) { await submitOrder(this.page, opts); }
}
