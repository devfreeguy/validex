import {
  TIER_BAZAAR_META,
  TIER_PRICE_ATOMIC,
  TierKey,
} from '@/x402/x402.constants';

// Shared across every discovery surface (/.well-known/*, /llms.txt,
// /agents.md, the root HTML page, the x402-merchant extension) so identity
// only needs to change in one place.
export const SERVICE_NAME = 'Validex';
export const SERVICE_DESCRIPTION =
  'Startup health and validation API providing automated security, trust, web presence, and engineering analysis, individually or as a comprehensive report with AI interpretation.';

function atomicUsdcToDollars(atomic: string): string {
  return `$${(Number(atomic) / 1_000_000).toFixed(2)}`;
}

// Derived from x402.constants.ts's TIER_BAZAAR_META/TIER_PRICE_ATOMIC
// (the single source of truth for per-tier identity and pricing) rather
// than hand-duplicated here, so the two can't drift out of sync.
export const TIER_PRICE_USD: Record<TierKey, string> = Object.fromEntries(
  (Object.entries(TIER_PRICE_ATOMIC) as Array<[TierKey, string]>).map(
    ([tier, atomic]) => [tier, atomicUsdcToDollars(atomic)],
  ),
) as Record<TierKey, string>;

export const TIER_SUMMARY: Record<TierKey, string> = Object.fromEntries(
  (Object.keys(TIER_BAZAAR_META) as TierKey[]).map((tier) => [
    tier,
    TIER_BAZAAR_META[tier].description,
  ]),
) as Record<TierKey, string>;

export const TIER_BODY_HINT: Record<TierKey, string> = {
  security: 'Body: {"target": "..."}',
  trust: 'Body: {"target": "..."}',
  web: 'Body: {"target": "..."}',
  engineering: 'Body: {"target": "..."}',
  ai: 'Body: {"target": "..."}',
  compare: 'Body: {"targets": ["...", "..."]}',
  quick: 'Body: {"target": "..."}',
  full: 'Body: {"target": "..."}',
};

export const TIER_DESCRIPTIONS: Record<TierKey, string> = Object.fromEntries(
  (Object.keys(TIER_BAZAAR_META) as TierKey[]).map((tier) => [
    tier,
    `${TIER_SUMMARY[tier]} ${TIER_PRICE_USD[tier]}. ${TIER_BODY_HINT[tier]}`,
  ]),
) as Record<TierKey, string>;
