import {
  validateDiscoveryExtension,
  bazaarResourceServerExtension,
} from '@x402/extensions/bazaar';
import { x402ResourceServer } from '@x402/core/server';
import {
  TIER_BAZAAR_META,
  TIER_PRICE_ATOMIC,
  TierKey,
  X402_CHALLENGE_TAG,
} from './x402.constants';
import { X402Service } from './x402.service';

jest.mock('@x402/avm/exact/server', () => ({
  ExactAvmScheme: jest.fn().mockImplementation(() => ({
    scheme: 'exact',
    parsePrice: jest.fn().mockImplementation(async (price: any) => ({
      amount: price.amount,
      asset: price.asset,
      extra: price.extra || {},
    })),
    enhancePaymentRequirements: jest
      .fn()
      .mockImplementation(async (reqs: any) => reqs),
  })),
}));

describe('Bazaar Discovery Extension & Challenge Tag Validation', () => {
  const mockAlgorandConfig = {
    facilitatorUrl: 'https://facilitator.goplausible.xyz',
    network: 'testnet',
    caip2Network: 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
    usdcAssetId: '10458941',
    walletAddress: 'XDF3Q2QCJDEP7DSK4L3E5MFOG4W7346AOBEPEB5UKPDYVA2TEUSPM4LZWY',
  } as any;

  let service: X402Service;
  let server: x402ResourceServer;

  beforeEach(async () => {
    service = new X402Service(mockAlgorandConfig);
    server = new x402ResourceServer({
      getSupported: async () => ({
        kinds: [
          {
            x402Version: 2,
            scheme: 'exact',
            network: mockAlgorandConfig.caip2Network,
            extra: {
              feePayer:
                'ZMFK2OI7ZBD2U27ISERZC4S6LKM6WMFJPZQ4MYNJDZ2VNBNMBA67RA22AA',
            },
          },
        ],
        extensions: ['bazaar'],
      }),
    });
    server.registerExtension(bazaarResourceServerExtension);
    const mockScheme = {
      scheme: 'exact',
      defaultAssetTransferMethod: 'default',
      paymentFlows: {
        default: {
          supported: ['authorization', 'upfront'],
          default: 'authorization',
        },
      },
      parsePrice: async (price: any) => ({
        amount: price.amount,
        asset: price.asset,
        extra: price.extra || {},
      }),
      enhancePaymentRequirements: async (reqs: any, supportedKind: any) => ({
        ...reqs,
        extra: {
          ...reqs.extra,
          ...(supportedKind?.extra?.feePayer
            ? { feePayer: supportedKind.extra.feePayer }
            : {}),
        },
      }),
    };
    server.register(mockAlgorandConfig.caip2Network, mockScheme as any);
    await server.initialize();
    (service as any).server = server;
  });

  const tiers = Object.keys(TIER_BAZAAR_META) as TierKey[];

  describe('buildPaymentRequirements', () => {
    tiers.forEach((tier) => {
      it(`should include x402-global-challenge in extra.tag for tier: ${tier}`, async () => {
        const reqs = await service.buildPaymentRequirements(tier);

        expect(reqs.scheme).toBe('exact');
        expect(reqs.network).toBe(mockAlgorandConfig.caip2Network);
        expect(reqs.asset).toBe(mockAlgorandConfig.usdcAssetId);
        expect(reqs.amount).toBe(TIER_PRICE_ATOMIC[tier]);
        expect(reqs.payTo).toBe(mockAlgorandConfig.walletAddress);
        expect(reqs.extra).toBeDefined();
        expect(reqs.extra?.tag).toBe(X402_CHALLENGE_TAG);
        expect(reqs.extra?.decimals).toBe(6);
      });
    });
  });

  describe('buildPaymentRequiredResponse', () => {
    tiers.forEach((tier) => {
      it(`should generate valid Bazaar discovery extension & merchant metadata for tier: ${tier}`, async () => {
        const url = `https://api.validex.space/v1/validate/${tier}`;
        const response = await service.buildPaymentRequiredResponse(tier, url);

        // 1. Payment requirements must contain the challenge tag
        expect(response.accepts).toBeDefined();
        expect(response.accepts.length).toBeGreaterThan(0);
        expect(response.accepts[0].extra?.tag).toBe(X402_CHALLENGE_TAG);
        expect(response.accepts[0].extra?.decimals).toBe(6);

        // 2. Resource info verification
        expect(response.resource).toBeDefined();
        expect(response.resource.url).toBe(url);
        expect(response.resource.serviceName).toBe(TIER_BAZAAR_META[tier].serviceName);
        expect(response.resource.tags).toContain(X402_CHALLENGE_TAG);
        expect(response.resource.iconUrl).toBe('https://api.validex.space/apple-touch-icon.png');

        // 3. Bazaar extension verification
        expect(response.extensions).toBeDefined();
        expect(response.extensions?.bazaar).toBeDefined();

        const validationResult = validateDiscoveryExtension(
          response.extensions?.bazaar as any,
        );
        expect(validationResult.valid).toBe(true);
        expect(validationResult.errors).toBeUndefined();

        // 4. Input schema and method
        const bazaarInfo = (response.extensions?.bazaar as any).info;
        expect(bazaarInfo.input.type).toBe('http');
        expect(bazaarInfo.input.method).toBe('POST');
        expect(bazaarInfo.input.bodyType).toBe('json');
        if (tier === 'compare') {
          expect(bazaarInfo.input.body.targets).toBeDefined();
        } else {
          expect(bazaarInfo.input.body.target).toBeDefined();
        }

        // 5. Merchant metadata verification
        const merchant = response.extensions?.['x402-merchant'] as any;
        expect(merchant).toBeDefined();
        expect(merchant.info.name).toBe('Validex');
        expect(merchant.info.website).toBe('https://api.validex.space');
        expect(merchant.info.logo).toBe('https://api.validex.space/apple-touch-icon.png');
        expect(merchant.info.categories).toContain('validation');

        // 6. Merchant schema verification (x402 v2 spec: info + schema)
        expect(merchant.schema).toBeDefined();
        expect(merchant.schema.$schema).toBe(
          'https://json-schema.org/draft/2020-12/schema',
        );
        expect(merchant.schema.type).toBe('object');
        expect(merchant.schema.properties.name).toEqual({ type: 'string' });
        expect(merchant.schema.properties.website).toEqual({
          type: 'string',
          format: 'uri',
        });
        expect(merchant.schema.properties.logo).toEqual({
          type: 'string',
          format: 'uri',
        });
        expect(merchant.schema.properties.categories).toEqual({
          type: 'array',
          items: { type: 'string' },
        });
      });
    });
  });
});
