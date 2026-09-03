import { ConfigService } from '@nestjs/config';
import { AlgorandConfigService } from './algorand.config';

function buildService(env: Record<string, string>): AlgorandConfigService {
  const configService = {
    get: (key: string) => env[key],
  } as unknown as ConfigService;
  return new AlgorandConfigService(configService);
}

describe('AlgorandConfigService', () => {
  it('resolves mainnet vars when NETWORK=mainnet', () => {
    const service = buildService({
      NETWORK: 'mainnet',
      ALGO_MAINNET_WALLET_ADDRESS: 'MAINNET_WALLET',
      ALGO_MAINNET_USDC_ASSET_ID: '31566704',
      ALGO_MAINNET_FACILITATOR_URL: 'https://mainnet.facilitator',
      ALGO_TESTNET_WALLET_ADDRESS: 'TESTNET_WALLET',
      ALGO_TESTNET_USDC_ASSET_ID: '10458941',
      ALGO_TESTNET_FACILITATOR_URL: 'https://testnet.facilitator',
    });

    expect(service.network).toBe('mainnet');
    expect(service.walletAddress).toBe('MAINNET_WALLET');
    expect(service.usdcAssetId).toBe(31566704);
    expect(service.facilitatorUrl).toBe('https://mainnet.facilitator');
  });

  it('resolves testnet vars when NETWORK=testnet', () => {
    const service = buildService({
      NETWORK: 'testnet',
      ALGO_MAINNET_WALLET_ADDRESS: 'MAINNET_WALLET',
      ALGO_MAINNET_USDC_ASSET_ID: '31566704',
      ALGO_MAINNET_FACILITATOR_URL: 'https://mainnet.facilitator',
      ALGO_TESTNET_WALLET_ADDRESS: 'TESTNET_WALLET',
      ALGO_TESTNET_USDC_ASSET_ID: '10458941',
      ALGO_TESTNET_FACILITATOR_URL: 'https://testnet.facilitator',
    });

    expect(service.network).toBe('testnet');
    expect(service.walletAddress).toBe('TESTNET_WALLET');
    expect(service.usdcAssetId).toBe(10458941);
    expect(service.facilitatorUrl).toBe('https://testnet.facilitator');
  });
});
