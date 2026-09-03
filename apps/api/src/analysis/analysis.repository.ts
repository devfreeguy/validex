import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';

/**
 * Stub - persistence for Analysis/ValidatorResult records. No logic yet.
 */
@Injectable()
export class AnalysisRepository {
  constructor(private readonly db: DatabaseService) {}
}
