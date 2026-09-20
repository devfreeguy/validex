import { CategoryScore } from '@/engine/score.engine';
import {
  AnalysisTier,
  ValidationResult,
  ValidatorCategory,
} from './analysis.types';

export type Recommendation = 'integrate' | 'caution' | 'avoid';

/**
 * `recommendation` is always deterministic (derived from the overall score
 * by ValidateService.deriveRecommendation - never invented by the AI, which
 * only writes prose around it). `executiveSummary`/`insights`/`suggestions`/
 * `opportunities`/`riskFlags`/`categoryNarrative` are null when Groq is
 * unavailable/fails or the tier doesn't run AI at all - the deterministic
 * recommendation and full scores are still always returned.
 */
export interface AnalysisVerdict {
  recommendation: Recommendation;
  executiveSummary: string | null;
  insights: string[] | null;
  suggestions: string[] | null;
  opportunities: string[] | null;
  riskFlags: string[] | null;
  categoryNarrative: Partial<Record<ValidatorCategory, string>> | null;
}

export interface AnalysisReport {
  meta: {
    analysisId: string;
    algorithmVersion: string;
    generatedAt: string;
    cached: boolean;
    tier: AnalysisTier;
  };
  company: {
    domain: string;
    canonicalUrl: string;
    companyName: string | null;
    githubRepo: string | null;
  };
  /** Present only for AI-enabled tiers (ai/quick/full) - see AI_ENABLED_TIERS. */
  verdict?: AnalysisVerdict;
  summary: {
    score: number | null;
    grade: string;
    confidence: number;
    executiveSummary?: string;
  };
  categories: Record<ValidatorCategory, CategoryScore>;
  strengths: string[];
  weaknesses: string[];
  validators: ValidationResult[];
  sources: Array<{ name: string; url?: string }>;
}

export interface ComparisonRankingEntry {
  rank: number;
  domain: string;
  score: number | null;
  grade: string;
  confidence: number;
  analysisId: string;
}

export interface ComparisonFailedEntry {
  target: string;
  error: string;
}

export interface ComparisonLesson {
  domain: string;
  recommendations: string[];
}

/**
 * `winnerDomain` is always deterministic - it's ranking[0].domain, computed
 * by ValidateService.compare from the scores, never decided by the AI (same
 * principle as AnalysisVerdict.recommendation). The AI only narrates why,
 * and turns the winner's strengths / the others' weaknesses into concrete
 * per-domain lessons. All AI fields are null when Groq is unavailable/fails
 * or there were fewer than two scored results to compare.
 */
export interface ComparisonVerdict {
  winnerDomain: string;
  executiveSummary: string | null;
  winningFactors: string[] | null;
  lessons: ComparisonLesson[] | null;
}

export interface ComparisonReport {
  meta: {
    comparisonId: string;
    generatedAt: string;
    targetCount: number;
  };
  ranking: ComparisonRankingEntry[];
  results: AnalysisReport[];
  failed: ComparisonFailedEntry[];
  /** Present only when there were >= 2 scored results to compare. */
  verdict?: ComparisonVerdict;
}
