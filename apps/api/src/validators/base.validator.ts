import {
  CompanyEntity,
  ValidationResult,
  ValidatorCategory,
  ValidatorStatus,
  ValidatorTier,
} from '@/analysis/analysis.types';

/**
 * Not a NestJS injectable itself - subclasses are (`@Injectable()`), so they
 * can pull in provider services via DI while sharing this contract.
 */
export abstract class BaseValidator {
  abstract readonly validatorId: string;
  abstract readonly name: string;
  abstract readonly category: ValidatorCategory;
  abstract readonly tier: ValidatorTier;
  abstract readonly weight: number;
  abstract readonly maxScore: number;
  abstract readonly ttlSeconds: number;

  abstract execute(entity: CompanyEntity): Promise<ValidationResult>;

  /**
   * A data source was unreachable or inapplicable to this entity. Not a
   * failure of the validator itself.
   */
  unavailable(entity: CompanyEntity, reason?: string): ValidationResult {
    void entity;
    return {
      validatorId: this.validatorId,
      name: this.name,
      category: this.category,
      tier: this.tier,
      status: ValidatorStatus.UNAVAILABLE,
      score: null,
      maxScore: this.maxScore,
      weight: this.weight,
      confidence: 0,
      evidence: reason ? [{ statement: reason, source: this.validatorId }] : [],
    };
  }

  /**
   * The validator itself failed unexpectedly. Never rethrow from execute() -
   * catch and return this instead so a single validator can never crash the
   * engine.
   */
  error(entity: CompanyEntity, err: unknown): ValidationResult {
    void entity;
    const message = err instanceof Error ? err.message : String(err);
    return {
      validatorId: this.validatorId,
      name: this.name,
      category: this.category,
      tier: this.tier,
      status: ValidatorStatus.ERROR,
      score: null,
      maxScore: this.maxScore,
      weight: this.weight,
      confidence: 0,
      evidence: [{ statement: message, source: this.validatorId }],
    };
  }
}
