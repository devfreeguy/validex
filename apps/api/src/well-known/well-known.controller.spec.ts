import { WellKnownController } from './well-known.controller';
import { AlgorandConfigService } from '@/config/algorand.config';
import {
  SERVICE_DESCRIPTION,
  SERVICE_NAME,
  TIER_DESCRIPTIONS,
  TIER_PRICE_USD,
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

    it('should include an x402 authentication block', () => {
      const card = controller.getAgentCard(mockFastifyRequest);
      expect(card.authentication).toBeDefined();
      expect(card.authentication.protocol).toBe('x402');
      expect(card.authentication.version).toBe(2);
      expect(card.authentication.network).toBe('algorand');
      expect(card.authentication.asset).toBe('USDC');
      expect(card.authentication.paymentHeader).toBe('PAYMENT-SIGNATURE');
      expect(card.authentication.pricingManifest).toContain('/.well-known/x402');
    });

    it('should include an inputSchema on every skill', () => {
      const card = controller.getAgentCard(mockFastifyRequest);
      card.skills.forEach((skill) => {
        expect(skill.inputSchema).toBeDefined();
        expect(skill.inputSchema.type).toBe('object');
        expect(skill.inputSchema.properties).toBeDefined();
      });
    });

    it('should require "targets" for the compare skill and "target" for all others', () => {
      const card = controller.getAgentCard(mockFastifyRequest);
      const compareSkill = card.skills.find((s) => s.id === 'validate-compare');
      expect(compareSkill).toBeDefined();
      expect(compareSkill!.inputSchema.required).toContain('targets');
      expect(compareSkill!.inputSchema.properties['targets'].type).toBe('array');

      const otherSkills = card.skills.filter((s) => s.id !== 'validate-compare');
      otherSkills.forEach((skill) => {
        expect(skill.inputSchema.required).toContain('target');
        expect(skill.inputSchema.properties['target'].type).toBe('string');
      });
    });

    it('should include refresh field in all skill inputSchemas', () => {
      const card = controller.getAgentCard(mockFastifyRequest);
      card.skills.forEach((skill) => {
        expect(skill.inputSchema.properties['refresh']).toBeDefined();
        expect(skill.inputSchema.properties['refresh'].type).toBe('boolean');
      });
    });
  });

  describe('getMcpManifest', () => {
    it('should include all 8 tools', () => {
      const manifest = controller.getMcpManifest(mockFastifyRequest);
      expect(manifest.tools).toHaveLength(8);
    });

    it('should include an inputSchema on every tool', () => {
      const manifest = controller.getMcpManifest(mockFastifyRequest);
      manifest.tools.forEach((tool) => {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema.properties).toBeDefined();
      });
    });

    it('should require "targets" for validate_compare and "target" for all others', () => {
      const manifest = controller.getMcpManifest(mockFastifyRequest);
      const compareTool = manifest.tools.find((t) => t.name === 'validate_compare');
      expect(compareTool).toBeDefined();
      expect(compareTool!.inputSchema.required).toContain('targets');

      const otherTools = manifest.tools.filter((t) => t.name !== 'validate_compare');
      otherTools.forEach((tool) => {
        expect(tool.inputSchema.required).toContain('target');
      });
    });

    it('should include the price in each tool description', () => {
      const manifest = controller.getMcpManifest(mockFastifyRequest);
      const tiers = Object.keys(TIER_PRICE_ATOMIC) as TierKey[];
      manifest.tools.forEach((tool, index) => {
        expect(tool.description).toContain(TIER_PRICE_USD[tiers[index]]);
      });
    });

    it('should include the correct POST endpoint for each tool', () => {
      const manifest = controller.getMcpManifest(mockFastifyRequest);
      const tiers = Object.keys(TIER_PRICE_ATOMIC) as TierKey[];
      manifest.tools.forEach((tool, index) => {
        expect(tool.endpoint).toBe(`https://api.validex.online/v1/validate/${tiers[index]}`);
        expect(tool.method).toBe('POST');
      });
    });
  });
});
