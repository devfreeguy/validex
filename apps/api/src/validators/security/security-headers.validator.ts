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

const REQUIRED_HEADERS = [
  'strict-transport-security',
  'content-security-policy',
  'x-content-type-options',
  'x-frame-options',
  'referrer-policy',
];

const POINTS_PER_HEADER = 2;

@Injectable()
export class SecurityHeadersValidator extends BaseValidator {
  readonly validatorId = 'security_headers';
  readonly name = 'Security Headers';
  readonly category = ValidatorCategory.SECURITY;
  readonly tier = ValidatorTier.QUICK;
  readonly weight = 6;
  readonly maxScore = 10;
  readonly ttlSeconds = 43200;

  constructor(private readonly fetchService: FetchService) {
    super();
  }

  async execute(entity: CompanyEntity): Promise<ValidationResult> {
    try {
      const result = await this.fetchService.get(entity.canonicalUrl);
      if (!result) {
        return this.unavailable(entity, 'Website did not respond.');
      }

      const headerKeys = new Set(
        Object.keys(result.headers).map((key) => key.toLowerCase()),
      );
      const present = REQUIRED_HEADERS.filter((header) =>
        headerKeys.has(header),
      );
      const missing = REQUIRED_HEADERS.filter(
        (header) => !headerKeys.has(header),
      );
      const score = Math.min(present.length * POINTS_PER_HEADER, this.maxScore);

      return {
        validatorId: this.validatorId,
        name: this.name,
        category: this.category,
        tier: this.tier,
        status: ValidatorStatus.SUCCESS,
        score,
        maxScore: this.maxScore,
        weight: this.weight,
        confidence: 97,
        evidence: [
          {
            statement: `Present: ${present.length ? present.join(', ') : 'none'}. Missing: ${missing.length ? missing.join(', ') : 'none'}.`,
            source: this.validatorId,
            url: entity.canonicalUrl,
          },
        ],
        source: { name: 'HTTP Response Headers', url: entity.canonicalUrl },
      };
    } catch (err) {
      return this.error(entity, err);
    }
  }
}
