import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AnalysisStatus,
  AnalysisTier,
  CompanyEntity,
  ValidationResult,
  ValidatorStatus,
  ValidatorTier,
} from '@/analysis/analysis.types';
import { AnalysisReport } from '@/analysis/report.types';
import type { Analysis } from '@/generated/prisma/client';
import { AnalysisRepository } from '@/analysis/analysis.repository';
import { EntityResolutionService } from '@/entity/entity-resolution.service';
import { ValidatorRegistry } from '@/validators/registry/validator.registry';
import { BaseValidator } from '@/validators/base.validator';
import { ScoreEngine } from '@/engine/score.engine';
import { ConfidenceEngine } from '@/engine/confidence.engine';
import { EvidenceAggregator } from '@/engine/evidence.aggregator';
import { AiService } from '@/ai/ai.service';
import { CacheService } from '@/cache/cache.service';
import { QuickValidateDto } from './dto/quick-validate.dto';
import { FullValidateDto } from './dto/full-validate.dto';

// @paralleldrive/cuid2 is ESM-only; this CJS project loads it via a single
// cached dynamic import rather than a static require().
const cuid2 = import('@paralleldrive/cuid2');

interface GetAnalysisResponse {
  success: boolean;
  data:
    | AnalysisReport
    | { analysisId: string; status: AnalysisStatus; error?: string };
}

@Injectable()
export class ValidateService {
  constructor(
    private readonly configService: ConfigService,
    private readonly entityResolutionService: EntityResolutionService,
    private readonly validatorRegistry: ValidatorRegistry,
    private readonly analysisRepository: AnalysisRepository,
    private readonly scoreEngine: ScoreEngine,
    private readonly confidenceEngine: ConfidenceEngine,
    private readonly evidenceAggregator: EvidenceAggregator,
    private readonly aiService: AiService,
    private readonly cacheService: CacheService,
  ) {}

  async quickValidate(dto: QuickValidateDto): Promise<AnalysisReport> {
    const validators = this.validatorRegistry.getByTier(ValidatorTier.QUICK);
    return this.run(
      dto.target,
      dto.refresh ?? false,
      AnalysisTier.QUICK,
      validators,
    );
  }

  async fullValidate(dto: FullValidateDto): Promise<AnalysisReport> {
    // Quick + full validators together - the registry only holds these two
    // tiers today, so getAll() is exactly "quick and full".
    const validators = this.validatorRegistry.getAll();
    return this.run(
      dto.target,
      dto.refresh ?? false,
      AnalysisTier.FULL,
      validators,
    );
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

  private async run(
    target: string,
    refresh: boolean,
    tier: AnalysisTier,
    validators: BaseValidator[],
  ): Promise<AnalysisReport> {
    const { createId } = await cuid2;
    const analysisId = `val_${createId()}`;
    const algorithmVersion =
      this.configService.get<string>('app.algorithmVersion') ?? '1.0.0';
    const entity = await this.entityResolutionService.resolve(target);

    await this.analysisRepository.create({
      analysisId,
      tier,
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

      const executiveSummary = await this.aiService.generateSummary({
        domain: entity.domain,
        overallScore: scoreReport.overall.score,
        grade: scoreReport.overall.grade,
        categories: Object.fromEntries(
          Object.entries(scoreReport.categories).map(([category, value]) => [
            category,
            { score: value.score, confidence: value.confidence },
          ]),
        ),
        strengths: evidence.strengths,
        weaknesses: evidence.weaknesses,
        confidence,
      });

      const hasError = results.some((r) => r.status === ValidatorStatus.ERROR);
      const status = hasError
        ? AnalysisStatus.PARTIAL
        : AnalysisStatus.COMPLETED;

      const report: AnalysisReport = {
        meta: {
          analysisId,
          algorithmVersion,
          generatedAt: new Date().toISOString(),
          cached: false,
          tier,
        },
        company: {
          domain: entity.domain,
          canonicalUrl: entity.canonicalUrl,
          companyName: entity.companyName ?? null,
          githubRepo:
            entity.githubOrg && entity.githubRepo
              ? `${entity.githubOrg}/${entity.githubRepo}`
              : null,
        },
        summary: {
          score: scoreReport.overall.score,
          grade: scoreReport.overall.grade,
          confidence,
          ...(executiveSummary ? { executiveSummary } : {}),
        },
        categories: scoreReport.categories,
        strengths: evidence.strengths,
        weaknesses: evidence.weaknesses,
        validators: results,
        sources: evidence.sources,
      };

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
