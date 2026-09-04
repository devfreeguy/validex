import { Inject, Injectable } from '@nestjs/common';
import { ValidatorTier } from '@/analysis/analysis.types';
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

  getById(id: string): BaseValidator | undefined {
    return this.validators.find((validator) => validator.validatorId === id);
  }
}
