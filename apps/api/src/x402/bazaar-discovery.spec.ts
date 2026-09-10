import {
  validateDiscoveryExtension,
  bazaarResourceServerExtension,
} from '@x402/extensions/bazaar';
import { x402ResourceServer } from '@x402/core/server';
import { TIER_BAZAAR_META, TierKey } from './x402.constants';
import { X402Service } from './x402.service';

jest.mock('@x402/avm/exact/server', () => ({
  ExactAvmScheme: jest.fn().mockImplementation(() => ({
    enrichPaymentRequiredResponse: jest.fn(),
  })),
}));

describe('Bazaar Discovery Extension Validation', () => {
  const dummyRequirements = {
    scheme: 'exact',
    payTo: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ',
    network: 'algorand:wGZy2uoIUjFZwc7F36VfRTBHERncKxDb',
    price: { asset: '10458941', amount: '50000' },
  } as any;

  const mockAlgorandConfig = {
    facilitatorUrl: 'https://facilitator.goplausible.xyz',
    network: 'testnet',
    caip2Network: 'algorand:wGZy2uoIUjFZwc7F36VfRTBHERncKxDb',
    usdcAssetId: '10458941',
    walletAddress: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ',
  } as any;

  let service: X402Service;
  let server: x402ResourceServer;

  beforeEach(() => {
    service = new X402Service(mockAlgorandConfig);
    server = new x402ResourceServer({
      getSupported: async () => ({ kinds: [] }),
    });
    server.registerExtension(bazaarResourceServerExtension);
    (service as any).server = server;
  });

  const tiers = Object.keys(TIER_BAZAAR_META) as TierKey[];

  tiers.forEach((tier) => {
    it(`should generate a valid Bazaar discovery extension structure for tier: ${tier}`, async () => {
      const url = `https://api.validex.io/v1/validate/${tier}`;
      const response = await service.buildPaymentRequiredResponse(
        tier,
        url,
        dummyRequirements,
      );

      expect(response.extensions).toBeDefined();
      expect(response.extensions?.bazaar).toBeDefined();

      const validationResult = validateDiscoveryExtension(
        response.extensions?.bazaar as any,
      );

      expect(validationResult.valid).toBe(true);
      expect(validationResult.errors).toBeUndefined();
    });
  });
});
