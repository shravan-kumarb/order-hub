import { futureExpiry } from '../../src/domain/payment.js';

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key} — set DOTENV_KEY and run tests`);
  return val;
}

export const CARD_SUCCESS     = requireEnv('TEST_CARD_NUMBER_SUCCESS');
export const CARD_DECLINE     = requireEnv('TEST_CARD_NUMBER_DECLINED');
export const CARD_SUCCESS_ALT = requireEnv('TEST_CARD_NUMBER_ALT_SUCCESS');

export function validCard(
  overrides: Partial<{
    cardNumber: string;
    cardName: string;
    cardExpiryMonth: number;
    cardExpiryYear: number;
  }> = {},
) {
  return {
    cardNumber: CARD_SUCCESS,
    cardName: requireEnv('TEST_CARD_NAME'),
    ...futureExpiry(),
    ...overrides,
  };
}
