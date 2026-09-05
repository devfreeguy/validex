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
    tier: 'quick' | 'full';
  };
  company: {
    domain: string;
    canonicalUrl: string;
    companyName: string | null;
    githubRepo: string | null;
  };
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
