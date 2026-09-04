import { Injectable } from '@nestjs/common';
import {
  CompanyEntity,
  ValidationResult,
  ValidatorCategory,
  ValidatorStatus,
  ValidatorTier,
} from '@/analysis/analysis.types';
import { TlsProvider } from '@/providers/tls/tls.provider';
import { BaseValidator } from '../base.validator';

@Injectable()
export class TLSCertificateValidator extends BaseValidator {
  readonly validatorId = 'tls_certificate';
  readonly name = 'TLS Certificate';
  readonly category = ValidatorCategory.SECURITY;
  readonly tier = ValidatorTier.QUICK;
  readonly weight = 8;
  readonly maxScore = 10;
  readonly ttlSeconds = 86400;

  constructor(private readonly tlsProvider: TlsProvider) {
    super();
  }

  async execute(entity: CompanyEntity): Promise<ValidationResult> {
    try {
      const cert = await this.tlsProvider.inspect(entity.domain);
      if (!cert) {
        return this.unavailable(
          entity,
          'Could not establish a TLS connection.',
        );
      }

      let score: number;
      if (!cert.valid || cert.daysUntilExpiry < 0) {
        score = 0;
      } else if (cert.daysUntilExpiry <= 14) {
        score = 4;
      } else if (cert.daysUntilExpiry <= 30) {
        score = 7;
      } else {
        score = 10;
      }

      if (cert.selfSigned) {
        score = Math.min(score, 3);
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
        confidence: 95,
        evidence: [
          {
            statement: `Issuer: ${cert.issuer}. Valid until ${cert.validTo.toISOString()} (${cert.daysUntilExpiry} days remaining).${cert.selfSigned ? ' Certificate is self-signed.' : ''}`,
            source: this.validatorId,
          },
        ],
      };
    } catch (err) {
      return this.error(entity, err);
    }
  }
}
