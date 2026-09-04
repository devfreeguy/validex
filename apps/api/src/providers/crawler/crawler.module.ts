import { Module } from '@nestjs/common';
import { PlaywrightService } from './playwright.service';
import { CheerioService } from './cheerio.service';
import { FetchService } from './fetch.service';

@Module({
  providers: [PlaywrightService, CheerioService, FetchService],
  exports: [PlaywrightService, CheerioService, FetchService],
})
export class CrawlerModule {}
