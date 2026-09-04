import { Injectable } from '@nestjs/common';
import {
  CompanyEntity,
  ValidationResult,
  ValidatorCategory,
  ValidatorStatus,
  ValidatorTier,
} from '@/analysis/analysis.types';
import { DnsProvider } from '@/providers/dns/dns.provider';
import { BaseValidator } from '../base.validator';

@Injectable()
export class MXValidator extends BaseValidator {
  readonly validatorId = 'mx';
  readonly name = 'MX Records';
  readonly category = ValidatorCategory.TRUST;
  readonly tier = ValidatorTier.QUICK;
  readonly weight = 3;
  readonly maxScore = 10;
  readonly ttlSeconds = 86400;

  constructor(private readonly dnsProvider: DnsProvider) {
    super();
  }

  async execute(entity: CompanyEntity): Promise<ValidationResult> {
    try {
      const records = await this.dnsProvider.lookupMX(entity.domain);
      const count = records?.length ?? 0;

      let score: number;
      if (count === 0) {
        score = 0;
      } else if (count === 1) {
        score = 7;
      } else {
        score = 10;
      }

      const hosts = (records ?? []).map((record) => record.exchange);

      return {
        validatorId: this.validatorId,
        name: this.name,
        category: this.category,
        tier: this.tier,
        status: ValidatorStatus.SUCCESS,
        score,
        maxScore: this.maxScore,
        weight: this.weight,
        confidence: count === 0 ? 60 : 95,
        evidence: [
          {
            statement:
              count > 0
                ? `MX records: ${hosts.join(', ')}.`
                : 'No MX records found.',
            source: this.validatorId,
          },
        ],
        source: { name: 'DNS MX Record' },
      };
    } catch (err) {
      return this.error(entity, err);
    }
  }
}
