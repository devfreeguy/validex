import { Module } from '@nestjs/common';
import { CrawlerModule } from '@/providers/crawler/crawler.module';
import { GithubModule } from '@/providers/github/github.module';
import { EntityResolutionService } from './entity-resolution.service';

@Module({
  imports: [CrawlerModule, GithubModule],
  providers: [EntityResolutionService],
  exports: [EntityResolutionService],
})
export class EntityModule {}
