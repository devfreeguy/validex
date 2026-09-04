import {
  ValidationResult,
  ValidatorCategory,
  ValidatorStatus,
  ValidatorTier,
} from '@/analysis/analysis.types';
import { EvidenceAggregator } from './evidence.aggregator';

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
    evidence: [{ statement: 'default statement', source: 'test' }],
    ...overrides,
  };
}

describe('EvidenceAggregator', () => {
  const aggregator = new EvidenceAggregator();

  it('treats scores >= 80% of maxScore as strengths', () => {
    const r = result({
      score: 8,
      maxScore: 10,
      evidence: [{ statement: 'Great HTTPS setup.', source: 'https' }],
    });

    const { strengths, weaknesses } = aggregator.aggregate([r]);
    expect(strengths).toEqual(['Great HTTPS setup.']);
    expect(weaknesses).toEqual([]);
  });

  it('treats scores <= 30% of maxScore as weaknesses', () => {
    const r = result({
      score: 2,
      maxScore: 10,
      evidence: [{ statement: 'No SPF record.', source: 'spf' }],
    });

    const { strengths, weaknesses } = aggregator.aggregate([r]);
    expect(weaknesses).toEqual(['No SPF record.']);
    expect(strengths).toEqual([]);
  });

  it('always treats error status as a weakness regardless of score', () => {
    const r = result({
      status: ValidatorStatus.ERROR,
      score: null,
      evidence: [{ statement: 'Unexpected crash.', source: 'x' }],
    });

    const { weaknesses } = aggregator.aggregate([r]);
    expect(weaknesses).toEqual(['Unexpected crash.']);
  });

  it('excludes mid-range scores and unavailable results from both lists', () => {
    const mid = result({ score: 5, maxScore: 10 });
    const unavailable = result({
      status: ValidatorStatus.UNAVAILABLE,
      score: null,
    });

    const { strengths, weaknesses } = aggregator.aggregate([mid, unavailable]);
    expect(strengths).toEqual([]);
    expect(weaknesses).toEqual([]);
  });

  it('deduplicates sources by name', () => {
    const a = result({ source: { name: 'DNS', url: 'https://a' } });
    const b = result({ source: { name: 'DNS', url: 'https://b' } });
    const c = result({ source: { name: 'RDAP' } });

    const { sources } = aggregator.aggregate([a, b, c]);
    expect(sources).toHaveLength(2);
    expect(sources.map((s) => s.name).sort()).toEqual(['DNS', 'RDAP']);
  });

  it('flattens all evidence regardless of status', () => {
    const a = result({ evidence: [{ statement: 'one', source: 'a' }] });
    const b = result({
      evidence: [
        { statement: 'two', source: 'b' },
        { statement: 'three', source: 'b' },
      ],
    });

    const { allEvidence } = aggregator.aggregate([a, b]);
    expect(allEvidence).toHaveLength(3);
  });
});
