import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type AlgorandNetwork = 'testnet' | 'mainnet';

export interface AlgorandNetworkConfig {
  walletAddress: string;
  usdcAssetId: string;
  facilitatorUrl: string;
  network: AlgorandNetwork;
  caip2Network: string;
}

// CAIP-2 network identifiers are protocol constants, not environment
// configuration - https://namespaces.chainagnostic.org/algorand/caip2
const CAIP2_NETWORK: Record<AlgorandNetwork, string> = {
  testnet: 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
  mainnet: 'algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=',
};

const DEFAULT_USDC_ASSET_ID: Record<AlgorandNetwork, string> = {
  testnet: '10458941',
  mainnet: '31566704',
};

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
            caip2Network: CAIP2_NETWORK.mainnet,
            walletAddress: this.configService.get<string>(
              'ALGO_MAINNET_WALLET_ADDRESS',
              '',
            ),
            usdcAssetId: this.configService.get<string>(
              'ALGO_MAINNET_USDC_ASSET_ID',
              DEFAULT_USDC_ASSET_ID.mainnet,
            ),
            facilitatorUrl: this.configService.get<string>(
              'ALGO_MAINNET_FACILITATOR_URL',
              '',
            ),
          }
        : {
            network: 'testnet',
            caip2Network: CAIP2_NETWORK.testnet,
            walletAddress: this.configService.get<string>(
              'ALGO_TESTNET_WALLET_ADDRESS',
              '',
            ),
            usdcAssetId: this.configService.get<string>(
              'ALGO_TESTNET_USDC_ASSET_ID',
              DEFAULT_USDC_ASSET_ID.testnet,
            ),
            facilitatorUrl: this.configService.get<string>(
              'ALGO_TESTNET_FACILITATOR_URL',
              '',
            ),
          };
  }

  get walletAddress(): string {
    return this.config.walletAddress;
  }

  get usdcAssetId(): string {
    return this.config.usdcAssetId;
  }

  get facilitatorUrl(): string {
    return this.config.facilitatorUrl;
  }

  get network(): AlgorandNetwork {
    return this.config.network;
  }

  get caip2Network(): string {
    return this.config.caip2Network;
  }
}
