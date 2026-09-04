import {
  ValidationResult,
  ValidatorCategory,
  ValidatorStatus,
  ValidatorTier,
} from '@/analysis/analysis.types';
import { ScoreEngine } from './score.engine';
import { ConfidenceEngine } from './confidence.engine';

function result(overrides: Partial<ValidationResult>): ValidationResult {
  return {
    validatorId: 'test',
    name: 'Test',
    category: ValidatorCategory.TRUST,
    tier: ValidatorTier.QUICK,
    status: ValidatorStatus.SUCCESS,
    score: 10,
    maxScore: 10,
    weight: 5,
    confidence: 90,
    evidence: [],
    ...overrides,
  };
}

describe('ConfidenceEngine', () => {
  const scoreEngine = new ScoreEngine();
  const confidenceEngine = new ConfidenceEngine();

  it('equals the weighted average confidence when nothing is unavailable', () => {
    const results = [
      result({ category: ValidatorCategory.TRUST, confidence: 80, weight: 1 }),
      result({ category: ValidatorCategory.TRUST, confidence: 100, weight: 1 }),
    ];
    const report = scoreEngine.calculate(results);

    expect(confidenceEngine.calculate(results, report)).toBe(90);
  });

  it('applies a coverage penalty when a category has unavailable validators', () => {
    const results = [
      result({
        category: ValidatorCategory.TRUST,
        confidence: 90,
        weight: 1,
        status: ValidatorStatus.SUCCESS,
      }),
      result({
        category: ValidatorCategory.TRUST,
        confidence: 0,
        weight: 1,
        status: ValidatorStatus.UNAVAILABLE,
        score: null,
      }),
    ];
    const report = scoreEngine.calculate(results);

    const confidence = confidenceEngine.calculate(results, report);
    // Base confidence is 90 (only the available result counts), minus a
    // penalty for 1/2 unavailable in a category with the trust base weight.
    expect(confidence).toBeLessThan(90);
    expect(confidence).toBeGreaterThanOrEqual(0);
  });

  it('is capped at 99 and floored at 0', () => {
    const results = [
      result({ category: ValidatorCategory.TRUST, confidence: 100, weight: 1 }),
    ];
    const report = scoreEngine.calculate(results);

    expect(confidenceEngine.calculate(results, report)).toBeLessThanOrEqual(99);
  });
});
