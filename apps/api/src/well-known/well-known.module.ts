import { Module } from '@nestjs/common';
import { WellKnownController } from './well-known.controller';
import { RootDiscoveryController } from './root-discovery.controller';

@Module({
  controllers: [WellKnownController, RootDiscoveryController],
})
export class WellKnownModule {}
