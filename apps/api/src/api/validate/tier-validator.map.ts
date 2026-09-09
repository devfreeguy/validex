import { ValidatorCategory } from '@/analysis/analysis.types';
import { TierKey } from '@/x402/x402.constants';

export interface TierValidatorSpec {
  /** Run every validator regardless of category (quick/full/compare use this). */
  all?: boolean;
  /** Run only validators whose category is in this list. */
  categories?: ValidatorCategory[];
}

/**
 * Single source of truth for "which validators does this tier run" -
 * ValidateService resolves a request's validator set from this map (via
 * ValidatorRegistry.getByCategories/getAll) rather than switching on tier
 * key by hand.
 */
export const TIER_VALIDATOR_MAP: Record<TierKey, TierValidatorSpec> = {
  security: { categories: [ValidatorCategory.SECURITY] },
  trust: { categories: [ValidatorCategory.TRUST] },
  web: { categories: [ValidatorCategory.PRODUCT, ValidatorCategory.GROWTH] },
  engineering: { categories: [ValidatorCategory.ENGINEERING] },
  ai: { all: true },
  compare: { all: true },
  quick: { categories: [ValidatorCategory.SECURITY, ValidatorCategory.TRUST] },
  full: { all: true },
};

/**
 * The AI layer (Groq executive summary + risk flags + recommendation prose
 * + category narrative) runs only for these tiers - security/trust/web/
 * engineering/compare stay fully deterministic, no Groq call at all.
 */
export const AI_ENABLED_TIERS: ReadonlySet<TierKey> = new Set<TierKey>([
  'ai',
  'quick',
  'full',
]);
