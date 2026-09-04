import {
  ValidationResult,
  ValidatorCategory,
  ValidatorStatus,
  ValidatorTier,
} from '@/analysis/analysis.types';
import { ScoreEngine } from './score.engine';

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

describe('ScoreEngine', () => {
  const engine = new ScoreEngine();

  it('is deterministic for identical input', () => {
    const results = [
      result({
        category: ValidatorCategory.TRUST,
        score: 8,
        weight: 5,
        confidence: 90,
      }),
      result({
        category: ValidatorCategory.SECURITY,
        score: 6,
        weight: 5,
        confidence: 80,
      }),
    ];

    const first = engine.calculate(results);
    const second = engine.calculate(structuredClone(results));

    expect(second).toEqual(first);
  });

  it('redistributes weight from unavailable categories to available ones proportionally', () => {
    // Quick-tier shape: only trust and security have results; engineering,
    // product, growth, website have none at all.
    const results = [
      result({
        category: ValidatorCategory.TRUST,
        score: 10,
        maxScore: 10,
        weight: 5,
      }),
      result({
        category: ValidatorCategory.SECURITY,
        score: 10,
        maxScore: 10,
        weight: 5,
      }),
    ];

    const report = engine.calculate(results);

    // Base weights: trust=25, security=25 -> equal split of the other 50.
    expect(report.categories[ValidatorCategory.TRUST].weight).toBe(50);
    expect(report.categories[ValidatorCategory.SECURITY].weight).toBe(50);
    expect(report.categories[ValidatorCategory.TRUST].weightRedistributed).toBe(
      true,
    );
    expect(report.categories[ValidatorCategory.ENGINEERING].weight).toBe(0);
    expect(report.categories[ValidatorCategory.ENGINEERING].score).toBeNull();
    expect(report.categories[ValidatorCategory.WEBSITE].weight).toBe(0);

    // Both categories are perfect scores (100%), so overall is 100.
    expect(report.overall.score).toBe(100);
    expect(report.overall.grade).toBe('A+');
  });

  it('normalizes each validator score to a 0-100 percentage of its maxScore', () => {
    const results = [
      result({
        category: ValidatorCategory.TRUST,
        score: 5,
        maxScore: 10,
        weight: 1,
      }),
    ];

    const report = engine.calculate(results);

    expect(report.categories[ValidatorCategory.TRUST].score).toBe(50);
  });

  it('returns null overall score and 0 confidence when every category is unavailable', () => {
    const results = [
      result({
        category: ValidatorCategory.TRUST,
        status: ValidatorStatus.UNAVAILABLE,
        score: null,
      }),
    ];

    const report = engine.calculate(results);

    expect(report.overall.score).toBeNull();
    expect(report.overall.grade).toBe('F');
    for (const category of Object.values(ValidatorCategory)) {
      expect(report.categories[category].weight).toBe(0);
    }
  });

  it('assigns grade bands correctly', () => {
    const gradeFor = (score: number) =>
      engine.calculate([
        result({
          category: ValidatorCategory.TRUST,
          score,
          maxScore: 100,
          weight: 1,
        }),
      ]).overall.grade;

    expect(gradeFor(95)).toBe('A+');
    expect(gradeFor(85)).toBe('A');
    expect(gradeFor(75)).toBe('B+');
    expect(gradeFor(65)).toBe('B');
    expect(gradeFor(55)).toBe('C+');
    expect(gradeFor(45)).toBe('C');
    expect(gradeFor(35)).toBe('D');
    expect(gradeFor(10)).toBe('F');
  });
});
