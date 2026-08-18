import type { OrderFailure } from './types.js';

export function domainError(
  error: OrderFailure['error'],
  message: string,
): OrderFailure {
  return { ok: false, error, message };
}
