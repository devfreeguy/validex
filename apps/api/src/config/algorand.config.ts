import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type AlgorandNetwork = 'testnet' | 'mainnet';

export interface AlgorandNetworkConfig {
  walletAddress: string;
  usdcAssetId: number;
  facilitatorUrl: string;
  network: AlgorandNetwork;
}

/**
 * Single source of truth for Algorand network settings. Nothing outside
 * this service should read the ALGO_MAINNET_, ALGO_TESTNET_ or NETWORK env
 * vars directly - it resolves the active network once and exposes a flat
 * config.
 */
@Injectable()
export class AlgorandConfigService {
  private readonly config: AlgorandNetworkConfig;

  constructor(private readonly configService: ConfigService) {
    const network = this.configService.get<AlgorandNetwork>('NETWORK', {
      infer: true,
    }) as AlgorandNetwork;

    this.config =
      network === 'mainnet'
        ? {
            network,
            walletAddress: this.configService.get<string>(
              'ALGO_MAINNET_WALLET_ADDRESS',
              '',
            ),
            usdcAssetId: this.parseAssetId(
              this.configService.get<string>('ALGO_MAINNET_USDC_ASSET_ID'),
              31566704,
            ),
            facilitatorUrl: this.configService.get<string>(
              'ALGO_MAINNET_FACILITATOR_URL',
              '',
            ),
          }
        : {
            network: 'testnet',
            walletAddress: this.configService.get<string>(
              'ALGO_TESTNET_WALLET_ADDRESS',
              '',
            ),
            usdcAssetId: this.parseAssetId(
              this.configService.get<string>('ALGO_TESTNET_USDC_ASSET_ID'),
              10458941,
            ),
            facilitatorUrl: this.configService.get<string>(
              'ALGO_TESTNET_FACILITATOR_URL',
              '',
            ),
          };
  }

  private parseAssetId(raw: string | undefined, fallback: number): number {
    const parsed = raw !== undefined ? parseInt(raw, 10) : NaN;
    return Number.isNaN(parsed) ? fallback : parsed;
  }

  get walletAddress(): string {
    return this.config.walletAddress;
  }

  get usdcAssetId(): number {
    return this.config.usdcAssetId;
  }

  get facilitatorUrl(): string {
    return this.config.facilitatorUrl;
  }

  get network(): AlgorandNetwork {
    return this.config.network;
  }
}
