export type ValidateTier = 'quick' | 'full';

export const PAYMENT_HEADER = 'x-payment';

export const PROTECTED_ROUTES: Record<string, ValidateTier> = {
  'POST /v1/validate/quick': 'quick',
  'POST /v1/validate/full': 'full',
};

// USDC has 6 decimal places - amounts are atomic units.
export const TIER_PRICE_ATOMIC: Record<ValidateTier, string> = {
  quick: '500000',
  full: '1000000',
};

export const PAYMENT_TIMEOUT_SECONDS = 300;
