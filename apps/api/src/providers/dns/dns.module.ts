import { Module } from '@nestjs/common';
import { DnsProvider } from './dns.provider';

@Module({
  providers: [DnsProvider],
  exports: [DnsProvider],
})
export class DnsModule {}
