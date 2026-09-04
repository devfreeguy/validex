import { Injectable } from '@nestjs/common';
import { createId } from '@paralleldrive/cuid2';
import {
  AnalysisStatus,
  AnalysisTier,
  CompanyEntity,
  ValidationResult,
  ValidatorTier,
} from '@/analysis/analysis.types';
import { EntityResolutionService } from '@/entity/entity-resolution.service';
import { ValidatorRegistry } from '@/validators/registry/validator.registry';
import { BaseValidator } from '@/validators/base.validator';
import { QuickValidateDto } from './dto/quick-validate.dto';
import { FullValidateDto } from './dto/full-validate.dto';

export interface ValidateRunResult {
  analysisId: string;
  tier: AnalysisTier;
  status: AnalysisStatus;
  company: {
    domain: string;
    canonicalUrl: string;
    companyName?: string;
  };
  validators: ValidationResult[];
}

export interface AnalysisStatusStubResult {
  analysisId: string;
  status: AnalysisStatus;
}

@Injectable()
export class ValidateService {
  constructor(
    private readonly entityResolutionService: EntityResolutionService,
    private readonly validatorRegistry: ValidatorRegistry,
  ) {}

  async quickValidate(dto: QuickValidateDto): Promise<ValidateRunResult> {
    const entity = await this.entityResolutionService.resolve(dto.target);
    const validators = this.validatorRegistry.getByTier(ValidatorTier.QUICK);
    return this.run(entity, AnalysisTier.QUICK, validators);
  }

  async fullValidate(dto: FullValidateDto): Promise<ValidateRunResult> {
    const entity = await this.entityResolutionService.resolve(dto.target);
    // Quick + full validators together - the registry only holds these two
    // tiers today, so getAll() is exactly "quick and full".
    const validators = this.validatorRegistry.getAll();
    return this.run(entity, AnalysisTier.FULL, validators);
  }

  async getAnalysis(analysisId: string): Promise<AnalysisStatusStubResult> {
    return {
      analysisId,
      status: AnalysisStatus.PENDING,
    };
  }

  private async run(
    entity: CompanyEntity,
    tier: AnalysisTier,
    validators: BaseValidator[],
  ): Promise<ValidateRunResult> {
    const settled = await Promise.allSettled(
      validators.map((validator) => validator.execute(entity)),
    );

    const results: ValidationResult[] = settled.map((outcome, index) =>
      outcome.status === 'fulfilled'
        ? outcome.value
        : validators[index].error(entity, outcome.reason),
    );

    return {
      analysisId: `val_${createId()}`,
      tier,
      status: AnalysisStatus.COMPLETED,
      company: {
        domain: entity.domain,
        canonicalUrl: entity.canonicalUrl,
        companyName: entity.companyName,
      },
      validators: results,
    };
  }
}
