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
export class DMARCValidator extends BaseValidator {
  readonly validatorId = 'dmarc';
  readonly name = 'DMARC Record';
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
      const records = await this.dnsProvider.lookupTXT(
        `_dmarc.${entity.domain}`,
      );
      const dmarcRecord = (records ?? [])
        .map((chunks) => chunks.join(''))
        .find((record) => record.toLowerCase().startsWith('v=dmarc1'));

      if (!dmarcRecord) {
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
              statement: 'No DMARC TXT record found.',
              source: this.validatorId,
            },
          ],
          source: { name: 'DNS TXT Record' },
        };
      }

      const policyMatch = /p=(\w+)/i.exec(dmarcRecord);
      const policy = policyMatch?.[1]?.toLowerCase();

      let score: number;
      if (policy === 'reject') {
        score = 10;
      } else if (policy === 'quarantine') {
        score = 7;
      } else if (policy === 'none') {
        score = 3;
      } else {
        score = 0;
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
        evidence: [{ statement: dmarcRecord, source: this.validatorId }],
        source: { name: 'DNS TXT Record' },
      };
    } catch (err) {
      return this.error(entity, err);
    }
  }
}
