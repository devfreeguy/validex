import { Controller, Get } from '@nestjs/common';
import { AlgorandConfigService } from '@/config/algorand.config';

@Controller('health')
export class HealthController {
  constructor(private readonly algorandConfig: AlgorandConfigService) {}

  @Get()
  check() {
    return {
      status: 'ok',
      network: this.algorandConfig.network,
      facilitator: this.algorandConfig.facilitatorUrl,
      timestamp: new Date().toISOString(),
    };
  }
}
