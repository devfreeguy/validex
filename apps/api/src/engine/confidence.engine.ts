import { Injectable } from '@nestjs/common';
import {
  ValidationResult,
  ValidatorCategory,
  ValidatorStatus,
} from '@/analysis/analysis.types';
import { ScoreReport } from './score.engine';

const CONFIDENCE_CAP = 99;
const COVERAGE_PENALTY_FACTOR = 0.3;

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

@Injectable()
export class ConfidenceEngine {
  calculate(results: ValidationResult[], scoreReport: ScoreReport): number {
    const available = results.filter(
      (r) => r.status === ValidatorStatus.SUCCESS && r.score !== null,
    );
    const weightSum = available.reduce((sum, r) => sum + r.weight, 0);
    const base =
      weightSum > 0
        ? available.reduce((sum, r) => sum + r.confidence * r.weight, 0) /
          weightSum
        : 0;

    let penalty = 0;
    for (const category of Object.values(ValidatorCategory)) {
      const categoryScore = scoreReport.categories[category];
      if (
        categoryScore.validatorsUnavailable > 0 &&
        categoryScore.validatorsEvaluated > 0
      ) {
        penalty +=
          (categoryScore.validatorsUnavailable /
            categoryScore.validatorsEvaluated) *
          categoryScore.weight *
          COVERAGE_PENALTY_FACTOR;
      }
    }

    const confidence = Math.min(CONFIDENCE_CAP, Math.max(0, base - penalty));
    return round1(confidence);
  }
}
