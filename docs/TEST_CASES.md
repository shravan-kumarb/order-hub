# Test cases — QuickBite takeaway ordering

Living checklist aligned with the current product rules (menu/stock, discounts, 16-digit card, mandatory name + future MM/YYYY expiry).

## Business rules under test

| Area | Rule |
| --- | --- |
| Cart | At least one item |
| Stock | Cannot order more than available; stock drops only after successful payment |
| Discounts | `SAVE10`, `MEALDEAL` (burger+fries), `FREESHIP` (≥ £10); codes are case-sensitive |
| Card name | Mandatory (≥ 2 non-space chars) |
| Expiry | Month 1–12; year exactly **4 digits**; current month/year or later |
| Card number | Exactly **16** digits (spaces allowed); even last digit = pay, odd = decline |

---

## Unit (`npm run test:unit`)

| ID | Case | Expected |
| --- | --- | --- |
| U-01 | Valid even card + future expiry | Payment success |
| U-02 | Odd last digit | `Payment declined by issuer` |
| U-03 | Blank card name | `Cardholder name is required` |
| U-04 | Month 0 / 13 | `Expiry month must be between 1 and 12` |
| U-05 | Year `30` | `Expiry year should be four digits` |
| U-06 | Expiry Jan 2020 | `Card expiry must be a future date` |
| U-07 | Current month/year | Still valid |
| U-08 | Card not 16 digits | `Card number must be 16 digits` |
| U-09 | Successful order | Stock reduced; order id assigned |
| U-10 | Declined / invalid card / bad discount | Stock unchanged |
| U-11 | `SAVE10` / `MEALDEAL` eligibility | Correct discount or `INVALID_DISCOUNT` |
| U-12 | AI edge: stock±1, casing, spaced odd card, blank name, 2-digit year | As above |
| U-13 | SAVE10 on fries (299p): `discountPence = 29`, `totalPence = 270` | Not negative; floor applied |
| U-14 | Salad × 5 (exact stock) + burger × 1 in one order | `ok: true`; salad stock = 0; burger stock − 1 |
| U-15 | Card name `'   '` (3 spaces — raw length 3, blank after trim) | `INVALID_CARD`, name required |
| U-16 | FREESHIP at exactly 1000p (`subtotalPence < 1000` gate, so 1000 qualifies) | `discountPence = 150` |
| U-17 | Card name `'a'` (length 1 after trim) — confirms threshold is min(2), not min(1) | `INVALID_CARD`, name required |

## Contract (`npm run test:contract`)

| ID | Case | Expected |
| --- | --- | --- |
| C-01 | Valid order request shape | Parses |
| C-02 | Empty cart | `Cart must contain at least one item` |
| C-03 | Past expiry | `Card expiry must be a future date` |
| C-04 | Blank name | Fail |
| C-05 | Year `30` | `Expiry year should be four digits` |
| C-06 | Success/failure envelopes | Discriminated by `ok` |

## API / integration (`npm run test:api`)

| ID | Case | Expected |
| --- | --- | --- |
| A-01 | `GET /api/menu` | Items + stock |
| A-02 | Happy `POST /api/orders` | 201; stock decremented |
| A-03 | Odd card | 422 `PAYMENT_DECLINED` |
| A-04 | Empty cart | 400 `EMPTY_CART` |
| A-05 | Missing name/expiry fields | 400 `INVALID_CARD` |
| A-06 | Blank name | 400 + name message |
| A-07 | Expired card | 400 `INVALID_CARD` + future-date message |
| A-08 | Year not four digits | 400 `INVALID_CARD` + four-digits message |
| A-09 | Non-16-digit card | 422 `PAYMENT_DECLINED` + length message |
| A-10 | `MEALDEAL` via HTTP | Discount 200 |
| A-11 | 6 concurrent salad orders (stock = 5) | Exactly 5 succeed (201), 1 fails `INSUFFICIENT_STOCK` (422); final stock = 0 |
| A-12 | `FREESHIP` via HTTP when subtotal < £10 | 422 `INVALID_DISCOUNT` + "at least £10" message |
| A-13 | Unknown item id `pizza` | 422 `UNKNOWN_ITEM` (not an unhandled 500) |
| A-14 | Mixed cart: burger × 1, fries × 0 | 400 `INVALID_QUANTITY` |
| A-15 | Extra unknown field alongside valid payload | 201 — field stripped silently; `SAVE10` applied |
| A-16 | Cart line with float quantity (`1.5`) — `z.number().int()` must reject | 400 `INVALID_QUANTITY` |
| A-17 | `GET /api/menu` after all units of an item are sold | `stock: 0` (not negative) |

## UI / E2E (`npm run test:e2e`)

Automation: Playwright — `tests/e2e/order.spec.ts` + `tests/e2e/helpers.ts`.

| ID | Case | Expected |
| --- | --- | --- |
| E-01 | Add burger+fries, SAVE10, valid card | Status shows paid order id |
| E-02 | Odd card | Decline message; cart kept |
| E-03 | Successful salad order | Stock badge decreases by 1 |
| E-04 | Clear name on card | `Cardholder name is required` |
| E-05 | Expiry year `30` | `Expiry year should be four digits` |
| E-06 | Expiry 01/2020 | Future-date message |
| E-07 | 10-digit card | `Card number must be 16 digits` |
| E-08 | Empty cart checkout | `Cart must contain at least one item` |
| E-09 | Burger+fries with MEALDEAL | Status shows paid + `saved £2.00` |
| E-10 | Burger+fries (1198p) with FREESHIP | Status shows paid + `saved £1.50` |
| E-11 | Page load with empty cart | `Cart is empty` visible; hidden after first add |
| E-12 | All salad stock drained via API | Add button for salad is disabled |
| E-13 | Add same item 3 times | Cart shows `× 3` and correct line total `£26.97` |
| E-14 | MEALDEAL with shake only (no burger+fries) | Status: `MEALDEAL requires a burger and fries` |
| E-15 | FREESHIP with fries only (299p < £10) | Status: `FREESHIP requires a subtotal of at least £10` |
| E-16 | Burger+fries order | Status contains paid + `£11.98` (pence-to-currency format verified in browser) |
| E-17 | Salad × 2 (1098p) with FREESHIP — nearest UI total to the 1000p boundary | Status shows paid + `saved £1.50` |
| E-18 | Burger stock drained before page load | Add button for burger disabled on initial render; salad button enabled |
| E-19 | Page reload after paid order | Status clears; cart shows "Cart is empty"; previous items not in cart |

---

## How to run

```bash
npm test              # unit + contract + api
npm run test:e2e      # Playwright (starts API + UI)
npm run test:all      # everything
```
