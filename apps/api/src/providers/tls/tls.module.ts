import { Module } from '@nestjs/common';
import { TlsProvider } from './tls.provider';

@Module({
  providers: [TlsProvider],
  exports: [TlsProvider],
})
export class TlsModule {}
