import { Module } from '@nestjs/common';
import { CrawlerModule } from '@/providers/crawler/crawler.module';
import { EntityResolutionService } from './entity-resolution.service';

@Module({
  imports: [CrawlerModule],
  providers: [EntityResolutionService],
  exports: [EntityResolutionService],
})
export class EntityModule {}
