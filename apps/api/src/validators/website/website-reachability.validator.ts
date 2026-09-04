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
export class WebsiteReachabilityValidator extends BaseValidator {
  readonly validatorId = 'website_reachability';
  readonly name = 'Website Reachability';
  readonly category = ValidatorCategory.WEBSITE;
  readonly tier = ValidatorTier.QUICK;
  readonly weight = 10;
  readonly maxScore = 10;
  readonly ttlSeconds = 3600;

  constructor(private readonly fetchService: FetchService) {
    super();
  }

  async execute(entity: CompanyEntity): Promise<ValidationResult> {
    try {
      const result = await this.fetchService.get(entity.canonicalUrl);
      if (!result) {
        return this.unavailable(entity, 'Website did not respond.');
      }

      const isSuccess = result.statusCode >= 200 && result.statusCode < 300;

      return {
        validatorId: this.validatorId,
        name: this.name,
        category: this.category,
        tier: this.tier,
        status: ValidatorStatus.SUCCESS,
        score: isSuccess ? 10 : 5,
        maxScore: this.maxScore,
        weight: this.weight,
        confidence: isSuccess ? 98 : 90,
        evidence: [
          {
            statement: isSuccess
              ? `Website responded with HTTP ${result.statusCode}.`
              : `Website returned HTTP ${result.statusCode}.`,
            source: this.validatorId,
            url: entity.canonicalUrl,
          },
        ],
        source: { name: 'Website', url: entity.canonicalUrl },
      };
    } catch (err) {
      return this.error(entity, err);
    }
  }
}
