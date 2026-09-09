import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AnalysisStatus,
  AnalysisTier,
  CompanyEntity,
  ValidationResult,
  ValidatorStatus,
} from '@/analysis/analysis.types';
import {
  AnalysisReport,
  AnalysisVerdict,
  ComparisonFailedEntry,
  ComparisonRankingEntry,
  ComparisonReport,
  Recommendation,
} from '@/analysis/report.types';
import type { Analysis, Comparison } from '@/generated/prisma/client';
import { AnalysisRepository } from '@/analysis/analysis.repository';
import { ComparisonRepository } from '@/analysis/comparison.repository';
import { EntityResolutionService } from '@/entity/entity-resolution.service';
import { ValidatorRegistry } from '@/validators/registry/validator.registry';
import { BaseValidator } from '@/validators/base.validator';
import { ScoreEngine } from '@/engine/score.engine';
import { ConfidenceEngine } from '@/engine/confidence.engine';
import { EvidenceAggregator } from '@/engine/evidence.aggregator';
import { AiService, AIVerdict } from '@/ai/ai.service';
import { CacheService } from '@/cache/cache.service';
import { TierKey } from '@/x402/x402.constants';
import { AI_ENABLED_TIERS, TIER_VALIDATOR_MAP } from './tier-validator.map';
import { TargetValidateDto } from './dto/target-validate.dto';
import { CompareValidateDto } from './dto/compare-validate.dto';

// @paralleldrive/cuid2 is ESM-only; this CJS project loads it via a single
// cached dynamic import rather than a static require().
const cuid2 = import('@paralleldrive/cuid2');

interface GetAnalysisResponse {
  success: boolean;
  data:
    | AnalysisReport
    | { analysisId: string; status: AnalysisStatus; error?: string };
}

/**
 * TierKey (x402/route level) and AnalysisTier (persistence level) share the
 * exact same 8 lowercase string values by construction - see the comment on
 * AnalysisTier in analysis.types.ts. Centralized here rather than casting
 * ad hoc at every call site.
 */
function toAnalysisTier(tier: TierKey): AnalysisTier {
  return tier as unknown as AnalysisTier;
}

/**
 * score >= 70 integrate, 40-69 caution, < 40 avoid. A null score (e.g. every
 * validator failed) is treated as the most conservative outcome - there is
 * no positive signal to justify anything else.
 */
function deriveRecommendation(score: number | null): Recommendation {
  if (score === null) return 'avoid';
  if (score >= 70) return 'integrate';
  if (score >= 40) return 'caution';
  return 'avoid';
}

@Injectable()
export class ValidateService {
  constructor(
    private readonly configService: ConfigService,
    private readonly entityResolutionService: EntityResolutionService,
    private readonly validatorRegistry: ValidatorRegistry,
    private readonly analysisRepository: AnalysisRepository,
    private readonly comparisonRepository: ComparisonRepository,
    private readonly scoreEngine: ScoreEngine,
    private readonly confidenceEngine: ConfidenceEngine,
    private readonly evidenceAggregator: EvidenceAggregator,
    private readonly aiService: AiService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Shared by all 7 single-target endpoints (security, trust, web,
   * engineering, ai, quick, full) - they differ only by tier key, which
   * determines the validator set (TIER_VALIDATOR_MAP), whether AI runs
   * (AI_ENABLED_TIERS), and the response shape (`ai` gets the AI-forward
   * ordering; the rest keep the scores-first shape).
   */
  async validateTarget(
    tierKey: TierKey,
    dto: TargetValidateDto,
  ): Promise<AnalysisReport> {
    const validators = this.resolveValidators(tierKey);
    return this.runPipeline(
      dto.target,
      dto.refresh ?? false,
      tierKey,
      validators,
      {
        runAi: AI_ENABLED_TIERS.has(tierKey),
        aiForward: tierKey === 'ai',
      },
    );
  }

  /**
   * Runs the full deterministic pipeline for each target in parallel - one
   * failed target never fails the others (Promise.allSettled). No AI step.
   * Compare is priced flat per call, not per target.
   */
  async compare(dto: CompareValidateDto): Promise<ComparisonReport> {
    const validators = this.resolveValidators('compare');
    const targets = dto.targets;

    const settled = await Promise.allSettled(
      targets.map((target) =>
        this.runPipeline(target, dto.refresh ?? false, 'compare', validators, {
          runAi: false,
          aiForward: false,
        }),
      ),
    );

    const results: AnalysisReport[] = [];
    const failed: ComparisonFailedEntry[] = [];
    settled.forEach((outcome, index) => {
      if (outcome.status === 'fulfilled') {
        results.push(outcome.value);
      } else {
        const reason = outcome.reason;
        failed.push({
          target: targets[index],
          error: reason instanceof Error ? reason.message : String(reason),
        });
      }
    });

    const ranked = [...results].sort(
      (a, b) => (b.summary.score ?? -1) - (a.summary.score ?? -1),
    );
    const ranking: ComparisonRankingEntry[] = ranked.map((report, index) => ({
      rank: index + 1,
      domain: report.company.domain,
      score: report.summary.score,
      grade: report.summary.grade,
      confidence: report.summary.confidence,
      analysisId: report.meta.analysisId,
    }));

    const { createId } = await cuid2;
    const comparisonId = `cmp_${createId()}`;

    await this.comparisonRepository.create({
      comparisonId,
      targets,
      targetCount: targets.length,
      ranking,
    });

    return {
      meta: {
        comparisonId,
        generatedAt: new Date().toISOString(),
        targetCount: targets.length,
      },
      ranking,
      results: ranked,
      failed,
    };
  }

  async getComparison(comparisonId: string): Promise<{
    success: boolean;
    data: {
      comparisonId: string;
      targets: string[];
      targetCount: number;
      ranking: unknown;
      analysisIds: string[];
      createdAt: Date;
    };
  }> {
    const comparison =
      await this.comparisonRepository.findByComparisonId(comparisonId);
    if (!comparison) {
      throw new NotFoundException({
        success: false,
        error: 'Comparison not found.',
      });
    }

    return {
      success: true,
      data: this.toComparisonResponse(comparison),
    };
  }

  async getAnalysis(analysisId: string): Promise<GetAnalysisResponse> {
    const analysis = await this.analysisRepository.findByAnalysisId(analysisId);
    if (!analysis) {
      throw new NotFoundException({
        success: false,
        error: 'Analysis not found.',
      });
    }

    if (
      analysis.status === AnalysisStatus.COMPLETED ||
      analysis.status === AnalysisStatus.PARTIAL
    ) {
      return {
        success: true,
        data: analysis.result as unknown as AnalysisReport,
      };
    }

    if (analysis.status === AnalysisStatus.FAILED) {
      return {
        success: false,
        data: {
          analysisId: analysis.analysisId,
          status: AnalysisStatus.FAILED,
          error: analysis.errorMessage ?? undefined,
        },
      };
    }

    return {
      success: true,
      data: {
        analysisId: analysis.analysisId,
        status: analysis.status as AnalysisStatus,
      },
    };
  }

  private resolveValidators(tierKey: TierKey): BaseValidator[] {
    const spec = TIER_VALIDATOR_MAP[tierKey];
    return spec.all
      ? this.validatorRegistry.getAll()
      : this.validatorRegistry.getByCategories(spec.categories ?? []);
  }

  private toComparisonResponse(comparison: Comparison) {
    const ranking = comparison.ranking as unknown as ComparisonRankingEntry[];
    return {
      comparisonId: comparison.comparisonId,
      targets: comparison.targets,
      targetCount: comparison.targetCount,
      ranking,
      analysisIds: ranking.map((entry) => entry.analysisId),
      createdAt: comparison.createdAt,
    };
  }

  private async runPipeline(
    target: string,
    refresh: boolean,
    tierKey: TierKey,
    validators: BaseValidator[],
    options: { runAi: boolean; aiForward: boolean },
  ): Promise<AnalysisReport> {
    const { createId } = await cuid2;
    const analysisId = `val_${createId()}`;
    const algorithmVersion =
      this.configService.get<string>('app.algorithmVersion') ?? '1.0.0';
    const entity = await this.entityResolutionService.resolve(target);
    const analysisTier = toAnalysisTier(tierKey);

    await this.analysisRepository.create({
      analysisId,
      tier: analysisTier,
      status: AnalysisStatus.RUNNING,
      target,
      domain: entity.domain,
      canonicalUrl: entity.canonicalUrl,
      companyName: entity.companyName ?? null,
      refresh,
      algorithmVersion,
    });

    try {
      const results = await this.runValidators(entity, validators, refresh);

      const scoreReport = this.scoreEngine.calculate(results);
      const confidence = this.confidenceEngine.calculate(results, scoreReport);
      const evidence = this.evidenceAggregator.aggregate(results);
      const recommendation = deriveRecommendation(scoreReport.overall.score);

      let aiVerdict: AIVerdict | null = null;
      if (options.runAi) {
        // Only forward categories this tier actually evaluated - a
        // category-scoped endpoint (e.g. quick's security+trust) has no
        // data for the others, so nothing to narrate for them.
        const evaluatedCategories = Object.fromEntries(
          Object.entries(scoreReport.categories)
            .filter(([, value]) => value.score !== null)
            .map(([category, value]) => [
              category,
              { score: value.score, confidence: value.confidence },
            ]),
        );

        aiVerdict = await this.aiService.generateVerdict({
          domain: entity.domain,
          overallScore: scoreReport.overall.score,
          grade: scoreReport.overall.grade,
          recommendation,
          categories: evaluatedCategories,
          strengths: evidence.strengths,
          weaknesses: evidence.weaknesses,
          confidence,
        });
      }

      const hasError = results.some((r) => r.status === ValidatorStatus.ERROR);
      const status = hasError
        ? AnalysisStatus.PARTIAL
        : AnalysisStatus.COMPLETED;

      const report = this.assembleReport({
        analysisId,
        algorithmVersion,
        analysisTier,
        entity,
        scoreReport,
        confidence,
        evidence,
        results,
        recommendation,
        aiVerdict,
        runAi: options.runAi,
        aiForward: options.aiForward,
      });

      await this.analysisRepository.update(analysisId, {
        status,
        score: scoreReport.overall.score,
        confidence,
        grade: scoreReport.overall.grade,
        result: report as unknown as Analysis['result'],
        completedAt: new Date(),
        cached: false,
      });

      await this.analysisRepository.saveValidatorResults(
        results.map((result, index) => ({
          analysisId,
          validatorId: result.validatorId,
          category: result.category,
          status: result.status,
          score: result.score,
          maxScore: result.maxScore,
          weight: result.weight,
          confidence: result.confidence,
          evidence: result.evidence,
          source: result.source,
          metadata: result.metadata,
          ttl: validators[index].ttlSeconds,
          cachedUntil: new Date(
            Date.now() + validators[index].ttlSeconds * 1000,
          ),
        })),
      );

      return report;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.analysisRepository
        .update(analysisId, {
          status: AnalysisStatus.FAILED,
          errorMessage: message,
        })
        .catch(() => undefined);
      throw err;
    }
  }

  private assembleReport(args: {
    analysisId: string;
    algorithmVersion: string;
    analysisTier: AnalysisTier;
    entity: CompanyEntity;
    scoreReport: ReturnType<ScoreEngine['calculate']>;
    confidence: number;
    evidence: ReturnType<EvidenceAggregator['aggregate']>;
    results: ValidationResult[];
    recommendation: Recommendation;
    aiVerdict: AIVerdict | null;
    runAi: boolean;
    aiForward: boolean;
  }): AnalysisReport {
    const {
      analysisId,
      algorithmVersion,
      analysisTier,
      entity,
      scoreReport,
      confidence,
      evidence,
      results,
      recommendation,
      aiVerdict,
      runAi,
      aiForward,
    } = args;

    const meta = {
      analysisId,
      algorithmVersion,
      generatedAt: new Date().toISOString(),
      cached: false,
      tier: analysisTier,
    };
    const company = {
      domain: entity.domain,
      canonicalUrl: entity.canonicalUrl,
      companyName: entity.companyName ?? null,
      githubRepo:
        entity.githubOrg && entity.githubRepo
          ? `${entity.githubOrg}/${entity.githubRepo}`
          : null,
    };
    const scoreSummary = {
      score: scoreReport.overall.score,
      grade: scoreReport.overall.grade,
      confidence,
    };

    if (!runAi) {
      return {
        meta,
        company,
        summary: scoreSummary,
        categories: scoreReport.categories,
        strengths: evidence.strengths,
        weaknesses: evidence.weaknesses,
        validators: results,
        sources: evidence.sources,
      };
    }

    const verdict: AnalysisVerdict = {
      recommendation,
      executiveSummary: aiVerdict?.executiveSummary ?? null,
      riskFlags: aiVerdict?.riskFlags ?? null,
      categoryNarrative: aiVerdict?.categoryNarrative ?? null,
    };

    if (aiForward) {
      // AI content is primary - `verdict` is placed ahead of `summary` in
      // the object (and therefore in the serialized JSON) rather than
      // appended after it.
      return {
        meta,
        company,
        verdict,
        summary: scoreSummary,
        categories: scoreReport.categories,
        validators: results,
        strengths: evidence.strengths,
        weaknesses: evidence.weaknesses,
        sources: evidence.sources,
      };
    }

    // quick/full: existing scores-first shape, with the AI prose mirrored
    // into summary.executiveSummary for backward compatibility, plus the
    // same verdict fields available at the top level too.
    return {
      meta,
      company,
      summary: {
        ...scoreSummary,
        ...(verdict.executiveSummary
          ? { executiveSummary: verdict.executiveSummary }
          : {}),
      },
      categories: scoreReport.categories,
      strengths: evidence.strengths,
      weaknesses: evidence.weaknesses,
      validators: results,
      sources: evidence.sources,
      verdict,
    };
  }

  private async runValidators(
    entity: CompanyEntity,
    validators: BaseValidator[],
    refresh: boolean,
  ): Promise<ValidationResult[]> {
    const cacheChecks: Array<ValidationResult | null> = refresh
      ? validators.map(() => null)
      : await Promise.all(
          validators.map((validator) =>
            this.cacheService.getValidatorResult(
              entity.domain,
              validator.validatorId,
            ),
          ),
        );

    const settled = await Promise.allSettled(
      validators.map((validator, index) => {
        const cached = cacheChecks[index];
        if (cached) {
          return Promise.resolve<ValidationResult>({
            ...cached,
            metadata: { ...cached.metadata, fromCache: true },
          });
        }
        return validator.execute(entity);
      }),
    );

    const results = settled.map((outcome, index) =>
      outcome.status === 'fulfilled'
        ? outcome.value
        : validators[index].error(entity, outcome.reason),
    );

    await Promise.all(
      results.map((result, index) =>
        this.cacheService.setValidatorResult(
          entity.domain,
          validators[index].validatorId,
          result,
          validators[index].ttlSeconds,
        ),
      ),
    );

    return results;
  }
}
