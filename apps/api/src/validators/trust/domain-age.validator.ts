import { Injectable } from '@nestjs/common';
import {
  CompanyEntity,
  ValidationResult,
  ValidatorCategory,
  ValidatorStatus,
  ValidatorTier,
} from '@/analysis/analysis.types';
import { RdapProvider } from '@/providers/rdap/rdap.provider';
import { BaseValidator } from '../base.validator';

@Injectable()
export class DomainAgeValidator extends BaseValidator {
  readonly validatorId = 'domain_age';
  readonly name = 'Domain Age';
  readonly category = ValidatorCategory.TRUST;
  readonly tier = ValidatorTier.QUICK;
  readonly weight = 7;
  readonly maxScore = 10;
  readonly ttlSeconds = 2_592_000;

  constructor(private readonly rdapProvider: RdapProvider) {
    super();
  }

  async execute(entity: CompanyEntity): Promise<ValidationResult> {
    try {
      const result = await this.rdapProvider.lookup(entity.domain);
      if (!result || result.domainAgeInDays === null) {
        return this.unavailable(entity, 'RDAP registration data unavailable.');
      }

      const daysOld = result.domainAgeInDays;
      let score: number;
      if (daysOld < 30) {
        score = 1;
      } else if (daysOld <= 180) {
        score = 4;
      } else if (daysOld <= 365) {
        score = 7;
      } else {
        score = 10;
      }

      const completenessFields = [
        result.registeredAt,
        result.registrar,
        result.expiresAt,
        result.updatedAt,
        result.status.length > 0,
      ];
      const presentCount = completenessFields.filter(Boolean).length;
      const confidence = Math.round(
        50 + (presentCount / completenessFields.length) * 48,
      );

      return {
        validatorId: this.validatorId,
        name: this.name,
        category: this.category,
        tier: this.tier,
        status: ValidatorStatus.SUCCESS,
        score,
        maxScore: this.maxScore,
        weight: this.weight,
        confidence,
        evidence: [
          {
            statement: `Registrar: ${result.registrar ?? 'unknown'}. Registered: ${result.registeredAt?.toISOString() ?? 'unknown'}. Age: ${daysOld} days.`,
            source: this.validatorId,
          },
        ],
        source: { name: 'RDAP', url: 'https://rdap.org' },
      };
    } catch (err) {
      return this.error(entity, err);
    }
  }
}
