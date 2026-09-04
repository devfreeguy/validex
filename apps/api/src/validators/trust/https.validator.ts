import { Injectable } from '@nestjs/common';
import {
  CompanyEntity,
  ValidationResult,
  ValidatorCategory,
  ValidatorStatus,
  ValidatorTier,
} from '@/analysis/analysis.types';
import { FetchService } from '@/providers/crawler/fetch.service';
import { BaseValidator } from '../base.validator';

@Injectable()
export class HTTPSValidator extends BaseValidator {
  readonly validatorId = 'https';
  readonly name = 'HTTPS Enforcement';
  readonly category = ValidatorCategory.TRUST;
  readonly tier = ValidatorTier.QUICK;
  readonly weight = 8;
  readonly maxScore = 10;
  readonly ttlSeconds = 86400;

  constructor(private readonly fetchService: FetchService) {
    super();
  }

  async execute(entity: CompanyEntity): Promise<ValidationResult> {
    try {
      const result = await this.fetchService.get(entity.canonicalUrl);
      if (!result) {
        return this.unavailable(entity, 'Website did not respond.');
      }

      const isHttps =
        entity.canonicalUrl.startsWith('https://') &&
        result.finalUrl.startsWith('https://');

      return {
        validatorId: this.validatorId,
        name: this.name,
        category: this.category,
        tier: this.tier,
        status: ValidatorStatus.SUCCESS,
        score: isHttps ? 10 : 0,
        maxScore: this.maxScore,
        weight: this.weight,
        confidence: 99,
        evidence: [
          {
            statement: isHttps
              ? 'Website is served over HTTPS with no downgrade to HTTP.'
              : `Website did not stay on HTTPS (final URL: ${result.finalUrl}).`,
            source: this.validatorId,
            url: result.finalUrl,
          },
        ],
      };
    } catch (err) {
      return this.error(entity, err);
    }
  }
}
