export interface Evidence {
  statement: string;
  source: string;
  url?: string;
}

export interface ValidationResult {
  validatorId: string;
  name: string;
  category: string;
  tier: 'quick' | 'full';
  status: 'success' | 'unavailable' | 'error';
  score: number | null;
  maxScore: number;
  weight: number;
  confidence: number;
  evidence: Evidence[];
  source?: { name: string; url?: string };
  metadata?: Record<string, unknown>;
}

export type Recommendation = 'integrate' | 'caution' | 'avoid';

export interface AnalysisVerdict {
  recommendation: Recommendation;
  executiveSummary: string | null;
  insights: string[] | null;
  suggestions: string[] | null;
  opportunities: string[] | null;
  riskFlags: string[] | null;
  categoryNarrative: Record<string, string> | null;
}

export interface CategoryScore {
  score: number | null;
  confidence: number;
  validatorsEvaluated: number;
  validatorsUnavailable: number;
  weight: number;
  weightRedistributed: boolean;
}

export interface AnalysisReport {
  meta: {
    analysisId: string;
    algorithmVersion: string;
    generatedAt: string;
    cached: boolean;
    tier: string;
  };
  company: {
    domain: string;
    canonicalUrl: string;
    companyName: string | null;
    githubRepo: string | null;
  };
  verdict?: AnalysisVerdict;
  summary: {
    score: number | null;
    grade: string;
    confidence: number;
    executiveSummary?: string;
  };
  categories: Record<string, CategoryScore>;
  strengths: string[];
  weaknesses: string[];
  validators: ValidationResult[];
  sources: Array<{ name: string; url?: string }>;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: string;
}
