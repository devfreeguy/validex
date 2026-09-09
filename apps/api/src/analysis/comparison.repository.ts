import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import type { Comparison, Prisma } from '@/generated/prisma/client';
import { ComparisonRankingEntry } from './report.types';

export interface CreateComparisonInput {
  comparisonId: string;
  targets: string[];
  targetCount: number;
  ranking: ComparisonRankingEntry[];
}

@Injectable()
export class ComparisonRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(data: CreateComparisonInput): Promise<Comparison> {
    return this.db.client.comparison.create({
      data: {
        comparisonId: data.comparisonId,
        targets: data.targets,
        targetCount: data.targetCount,
        ranking: JSON.parse(
          JSON.stringify(data.ranking),
        ) as Prisma.InputJsonValue,
      },
    });
  }

  async findByComparisonId(comparisonId: string): Promise<Comparison | null> {
    return this.db.client.comparison.findUnique({ where: { comparisonId } });
  }
}
