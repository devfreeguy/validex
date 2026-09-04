import { Injectable } from '@nestjs/common';
import {
  ValidationResult,
  ValidatorCategory,
  ValidatorStatus,
} from '@/analysis/analysis.types';

/**
 * Out of 100 across trust/security/engineering/product/growth. `website` is
 * intentionally 0: it covers foundational checks (reachability, sitemap)
 * that aren't part of the weighted category taxonomy the spec defines -
 * still measured and reported, but contributes nothing to the overall
 * score and never receives redistributed weight (0/total share).
 */
export const CATEGORY_WEIGHTS: Record<ValidatorCategory, number> = {
  [ValidatorCategory.TRUST]: 25,
  [ValidatorCategory.SECURITY]: 25,
  [ValidatorCategory.ENGINEERING]: 20,
  [ValidatorCategory.PRODUCT]: 20,
  [ValidatorCategory.GROWTH]: 10,
  [ValidatorCategory.WEBSITE]: 0,
};

export interface CategoryScore {
  score: number | null;
  confidence: number;
  validatorsEvaluated: number;
  validatorsUnavailable: number;
  /** Effective weight used in the final calculation, after redistribution. */
  weight: number;
  weightRedistributed: boolean;
}

export interface ScoreReport {
  overall: { score: number | null; grade: string };
  categories: Record<ValidatorCategory, CategoryScore>;
}

const GRADE_BANDS: Array<[number, string]> = [
  [90, 'A+'],
  [80, 'A'],
  [70, 'B+'],
  [60, 'B'],
  [50, 'C+'],
  [40, 'C'],
  [30, 'D'],
  [0, 'F'],
];

function gradeFor(score: number | null): string {
  if (score === null) return 'F';
  for (const [threshold, grade] of GRADE_BANDS) {
    if (score >= threshold) return grade;
  }
  return 'F';
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function isAvailable(result: ValidationResult): boolean {
  return result.status === ValidatorStatus.SUCCESS && result.score !== null;
}

@Injectable()
export class ScoreEngine {
  calculate(results: ValidationResult[]): ScoreReport {
    const allCategories = Object.values(ValidatorCategory);
    const categories = {} as Record<ValidatorCategory, CategoryScore>;

    for (const category of allCategories) {
      const inCategory = results.filter((r) => r.category === category);
      const available = inCategory.filter(isAvailable);

      let score: number | null = null;
      let confidence = 0;

      if (available.length > 0) {
        const weightSum = available.reduce((sum, r) => sum + r.weight, 0);
        if (weightSum > 0) {
          // Normalize each validator's score to a 0-100 percentage of its
          // own maxScore before weighting, so category/overall scores land
          // on the same 0-100 scale as the report (individual validator
          // scores are on their own 0-maxScore scale, e.g. 0-10).
          score = round1(
            available.reduce(
              (sum, r) =>
                sum + ((r.score as number) / r.maxScore) * 100 * r.weight,
              0,
            ) / weightSum,
          );
        }
        confidence = round1(
          available.reduce((sum, r) => sum + r.confidence, 0) /
            available.length,
        );
      }

      categories[category] = {
        score,
        confidence,
        validatorsEvaluated: inCategory.length,
        validatorsUnavailable: inCategory.length - available.length,
        weight: CATEGORY_WEIGHTS[category],
        weightRedistributed: false,
      };
    }

    const scoredCategories = allCategories.filter(
      (c) => categories[c].score !== null,
    );
    const nullCategories = allCategories.filter(
      (c) => categories[c].score === null,
    );
    const scoredBaseWeightSum = scoredCategories.reduce(
      (sum, c) => sum + CATEGORY_WEIGHTS[c],
      0,
    );
    const nullBaseWeightSum = nullCategories.reduce(
      (sum, c) => sum + CATEGORY_WEIGHTS[c],
      0,
    );

    if (scoredCategories.length === 0 || scoredBaseWeightSum === 0) {
      for (const category of allCategories) {
        categories[category].weight = 0;
      }
      return { overall: { score: null, grade: gradeFor(null) }, categories };
    }

    for (const category of allCategories) {
      const baseWeight = CATEGORY_WEIGHTS[category];
      const effectiveWeight =
        categories[category].score === null
          ? 0
          : baseWeight + (baseWeight / scoredBaseWeightSum) * nullBaseWeightSum;

      categories[category].weight = round1(effectiveWeight);
      categories[category].weightRedistributed = effectiveWeight !== baseWeight;
    }

    const weightedSum = scoredCategories.reduce(
      (sum, c) => sum + (categories[c].score as number) * categories[c].weight,
      0,
    );
    const totalEffectiveWeight = scoredCategories.reduce(
      (sum, c) => sum + categories[c].weight,
      0,
    );
    const overallScore =
      totalEffectiveWeight > 0
        ? round1(weightedSum / totalEffectiveWeight)
        : null;

    return {
      overall: { score: overallScore, grade: gradeFor(overallScore) },
      categories,
    };
  }
}
