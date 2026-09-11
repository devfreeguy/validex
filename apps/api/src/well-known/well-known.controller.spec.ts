import { WellKnownController } from './well-known.controller';
import { AlgorandConfigService } from '@/config/algorand.config';
import {
  SERVICE_DESCRIPTION,
  SERVICE_NAME,
  TIER_DESCRIPTIONS,
} from './well-known.constants';
import { TIER_PRICE_ATOMIC, TierKey } from '@/x402/x402.constants';

describe('WellKnownController', () => {
  const mockAlgorandConfig = {
    caip2Network: 'algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=',
    usdcAssetId: '31566704',
    walletAddress: '2URXEDGOHVIZYKUPRQGTCFOXJMVRZYUZLLOVX3KWYMB76CAZNOUBYSRM2Q',
    network: 'mainnet',
    facilitatorUrl: 'https://facilitator.goplausible.xyz',
  } as unknown as AlgorandConfigService;

  const mockFastifyRequest = {
    headers: {
      host: 'api.validex.online',
      'x-forwarded-proto': 'https',
    },
    protocol: 'https',
    hostname: 'api.validex.online',
  } as any;

  let controller: WellKnownController;

  beforeEach(() => {
    controller = new WellKnownController(mockAlgorandConfig);
  });

  describe('getX402Manifest', () => {
    it('should generate an x402 manifest adhering to the Global Challenge specification', () => {
      const manifest = controller.getX402Manifest(mockFastifyRequest);

      expect(manifest.x402Version).toBe(2);
      expect(manifest.name).toBe(SERVICE_NAME);
      expect(manifest.description).toBe(SERVICE_DESCRIPTION);
      expect(manifest.description).not.toMatch(/[—–]/);
      expect(manifest.resources).toBeInstanceOf(Array);
      expect(manifest.resources).toHaveLength(8);

      const tiers = Object.keys(TIER_PRICE_ATOMIC) as TierKey[];
      tiers.forEach((tier, index) => {
        const res = manifest.resources[index];
        expect(res.url).toBe(`https://api.validex.online/v1/validate/${tier}`);
        expect(res.method).toBe('POST');
        expect(res.description).toBe(TIER_DESCRIPTIONS[tier]);
        expect(res.description).toMatch(/\$\d+(\.\d+)?\.\s+Body:\s+\{.*\}$/);
        expect(res.description).not.toMatch(/[—–]/);
        expect(res.network).toBe(mockAlgorandConfig.caip2Network);
        expect(res.asset).toBe(mockAlgorandConfig.usdcAssetId);
        expect(res.amount).toBe(TIER_PRICE_ATOMIC[tier]);
        expect(res.payTo).toBe(mockAlgorandConfig.walletAddress);
        expect(res.extra).toEqual({
          tag: 'x402-global-challenge',
        });
      });
    });
  });

  describe('getAgentCard', () => {
    it('should include x402-global-challenge tag in skills', () => {
      const card = controller.getAgentCard(mockFastifyRequest);
      expect(card.skills).toHaveLength(8);
      card.skills.forEach((skill) => {
        expect(skill.tags).toContain('x402-global-challenge');
      });
    });
  });
});
