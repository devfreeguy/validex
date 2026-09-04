import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import type { Analysis, Prisma } from '@/generated/prisma/client';
import { AnalysisStatus, AnalysisTier } from './analysis.types';

export interface CreateAnalysisInput {
  analysisId: string;
  tier: AnalysisTier;
  status: AnalysisStatus;
  target: string;
  domain?: string | null;
  canonicalUrl?: string | null;
  companyName?: string | null;
  refresh?: boolean;
  algorithmVersion: string;
}

export interface ValidatorResultCreateInput {
  analysisId: string;
  validatorId: string;
  category: string;
  status: string;
  score: number | null;
  maxScore: number;
  weight: number;
  confidence: number;
  evidence?: unknown;
  source?: unknown;
  metadata?: unknown;
  ttl?: number;
  cachedUntil?: Date;
}

/** Strips non-JSON-safe values (e.g. Date instances) before writing to a Json column. */
function toJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

@Injectable()
export class AnalysisRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(data: CreateAnalysisInput): Promise<Analysis> {
    return this.db.client.analysis.create({
      data: {
        analysisId: data.analysisId,
        tier: data.tier as unknown as Prisma.AnalysisCreateInput['tier'],
        status: data.status as unknown as Prisma.AnalysisCreateInput['status'],
        target: data.target,
        domain: data.domain ?? null,
        canonicalUrl: data.canonicalUrl ?? null,
        companyName: data.companyName ?? null,
        refresh: data.refresh ?? false,
        algorithmVersion: data.algorithmVersion,
      },
    });
  }

  async update(id: string, data: Partial<Analysis>): Promise<Analysis> {
    const { id: _ignoredId, ...rest } = data;
    void _ignoredId;

    return this.db.client.analysis.update({
      where: { analysisId: id },
      data: {
        ...rest,
        result:
          toJson(rest.result) ?? (rest.result === null ? null : undefined),
      } as Prisma.AnalysisUpdateInput,
    });
  }

  async findByAnalysisId(analysisId: string): Promise<Analysis | null> {
    return this.db.client.analysis.findUnique({ where: { analysisId } });
  }

  async saveValidatorResults(
    results: ValidatorResultCreateInput[],
  ): Promise<void> {
    if (results.length === 0) return;

    await this.db.client.validatorResult.createMany({
      data: results.map((result) => ({
        analysisId: result.analysisId,
        validatorId: result.validatorId,
        category:
          result.category as unknown as Prisma.ValidatorResultCreateManyInput['category'],
        status:
          result.status as unknown as Prisma.ValidatorResultCreateManyInput['status'],
        score: result.score,
        maxScore: result.maxScore,
        weight: result.weight,
        confidence: result.confidence,
        evidence: toJson(result.evidence),
        source: toJson(result.source),
        metadata: toJson(result.metadata),
        ttl: result.ttl,
        cachedUntil: result.cachedUntil,
      })),
    });
  }
}
