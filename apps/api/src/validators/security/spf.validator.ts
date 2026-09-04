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
export class SPFValidator extends BaseValidator {
  readonly validatorId = 'spf';
  readonly name = 'SPF Record';
  readonly category = ValidatorCategory.SECURITY;
  readonly tier = ValidatorTier.QUICK;
  readonly weight = 5;
  readonly maxScore = 10;
  readonly ttlSeconds = 86400;

  constructor(private readonly dnsProvider: DnsProvider) {
    super();
  }

  async execute(entity: CompanyEntity): Promise<ValidationResult> {
    try {
      const records = await this.dnsProvider.lookupTXT(entity.domain);
      const spfRecord = (records ?? [])
        .map((chunks) => chunks.join(''))
        .find((record) => record.toLowerCase().startsWith('v=spf1'));

      if (!spfRecord) {
        return {
          validatorId: this.validatorId,
          name: this.name,
          category: this.category,
          tier: this.tier,
          status: ValidatorStatus.SUCCESS,
          score: 0,
          maxScore: this.maxScore,
          weight: this.weight,
          confidence: 95,
          evidence: [
            {
              statement: 'No SPF (v=spf1) TXT record found.',
              source: this.validatorId,
            },
          ],
        };
      }

      let score: number;
      if (spfRecord.includes('-all')) {
        score = 10;
      } else if (spfRecord.includes('~all')) {
        score = 7;
      } else {
        score = 4;
      }

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
        evidence: [{ statement: spfRecord, source: this.validatorId }],
      };
    } catch (err) {
      return this.error(entity, err);
    }
  }
}
