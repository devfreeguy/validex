import { Inject, Injectable } from '@nestjs/common';
import { ValidatorCategory, ValidatorTier } from '@/analysis/analysis.types';
import { BaseValidator } from '../base.validator';

export const VALIDATORS_TOKEN = 'VALIDATORS_TOKEN';

@Injectable()
export class ValidatorRegistry {
  constructor(
    @Inject(VALIDATORS_TOKEN) private readonly validators: BaseValidator[],
  ) {}

  getAll(): BaseValidator[] {
    return this.validators;
  }

  getByTier(tier: ValidatorTier): BaseValidator[] {
    return this.validators.filter((validator) => validator.tier === tier);
  }

  /**
   * Ignores each validator's own legacy `tier` (quick/full) - purely a
   * category filter, matching whichever categories the caller asks for
   * regardless of which of the two old tiers a validator happened to
   * belong to. Used by the category/tier-key endpoints (see
   * TIER_VALIDATOR_MAP in api/validate/tier-validator.map.ts).
   */
  getByCategories(categories: ValidatorCategory[]): BaseValidator[] {
    const wanted = new Set(categories);
    return this.validators.filter((validator) =>
      wanted.has(validator.category),
    );
  }

  getById(id: string): BaseValidator | undefined {
    return this.validators.find((validator) => validator.validatorId === id);
  }
}
