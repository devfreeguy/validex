import { Module } from '@nestjs/common';
import { DnsModule } from '@/providers/dns/dns.module';
import { TlsModule } from '@/providers/tls/tls.module';
import { CrawlerModule } from '@/providers/crawler/crawler.module';
import { TLSCertificateValidator } from './tls-certificate.validator';
import { SecurityHeadersValidator } from './security-headers.validator';
import { SPFValidator } from './spf.validator';
import { DMARCValidator } from './dmarc.validator';

const VALIDATORS = [
  TLSCertificateValidator,
  SecurityHeadersValidator,
  SPFValidator,
  DMARCValidator,
];

@Module({
  imports: [DnsModule, TlsModule, CrawlerModule],
  providers: [...VALIDATORS],
  exports: [...VALIDATORS],
})
export class SecurityValidatorsModule {}
