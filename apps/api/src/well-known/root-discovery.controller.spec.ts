import { RootDiscoveryController } from './root-discovery.controller';
import { TIER_PRICE_ATOMIC, TierKey } from '@/x402/x402.constants';
import { SERVICE_DESCRIPTION, SERVICE_NAME, TIER_PRICE_USD } from './well-known.constants';

// png.util and logo-asset use Node built-ins (zlib, fs) which work fine in
// Jest's node test environment - no mock needed.

const mockFastifyRequest = {
  headers: {
    host: 'api.validex.online',
    'x-forwarded-proto': 'https',
  },
  protocol: 'https',
  hostname: 'api.validex.online',
} as any;

const ORIGIN = 'https://api.validex.online';
const tiers = Object.keys(TIER_PRICE_ATOMIC) as TierKey[];

let controller: RootDiscoveryController;

beforeEach(() => {
  controller = new RootDiscoveryController();
});

// ──────────────────────────────────────────────────────────────────────────────
// getRootPage
// ──────────────────────────────────────────────────────────────────────────────
describe('getRootPage', () => {
  let html: string;

  beforeEach(() => {
    html = controller.getRootPage(mockFastifyRequest);
  });

  it('should include the service name and description', () => {
    expect(html).toContain(SERVICE_NAME);
    expect(html).toContain(SERVICE_DESCRIPTION);
  });

  it('should include all 8 tier endpoint paths', () => {
    tiers.forEach((tier) => {
      expect(html).toContain(`/v1/validate/${tier}`);
    });
  });

  it('should include all tier prices', () => {
    tiers.forEach((tier) => {
      expect(html).toContain(TIER_PRICE_USD[tier]);
    });
  });

  it('should include the free read endpoints', () => {
    expect(html).toContain('/v1/validate/:analysisId');
    expect(html).toContain('/v1/validate/compare/:comparisonId');
    expect(html).toContain('/v1/health');
  });

  it('should include all discovery resource links', () => {
    expect(html).toContain('/.well-known/x402');
    expect(html).toContain('/.well-known/agent-card.json');
    expect(html).toContain('/.well-known/agent.json');
    expect(html).toContain('/.well-known/ai-plugin.json');
    expect(html).toContain('/.well-known/mcp.json');
    expect(html).toContain('/openapi.json');
    expect(html).toContain('/llms.txt');
    expect(html).toContain('/agents.md');
  });

  it('should include x402 payment flow instructions', () => {
    expect(html).toContain('PAYMENT-SIGNATURE');
    expect(html).toContain('PAYMENT-REQUIRED');
    expect(html).toContain('x402');
    expect(html).toContain('Algorand');
  });

  it('should include the category weights', () => {
    expect(html).toContain('25%');
    expect(html).toContain('20%');
    expect(html).toContain('10%');
  });

  it('should include grade thresholds', () => {
    expect(html).toContain('A+');
    expect(html).toContain('integrate');
    expect(html).toContain('caution');
    expect(html).toContain('avoid');
  });

  it('should produce valid HTML with a single h1', () => {
    expect(html).toMatch(/<!doctype html>/i);
    const h1Matches = html.match(/<h1>/g);
    expect(h1Matches).toHaveLength(1);
  });

  it('should use the request origin in absolute URLs', () => {
    expect(html).toContain(ORIGIN);
  });

  it('should not contain any SiteLenz references', () => {
    expect(html.toLowerCase()).not.toContain('sitelenz');
    expect(html.toLowerCase()).not.toContain('site lenz');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// getLlmsTxt
// ──────────────────────────────────────────────────────────────────────────────
describe('getLlmsTxt', () => {
  let txt: string;

  beforeEach(() => {
    txt = controller.getLlmsTxt(mockFastifyRequest);
  });

  it('should include the service name and description', () => {
    expect(txt).toContain(SERVICE_NAME);
    expect(txt).toContain(SERVICE_DESCRIPTION);
  });

  it('should list all 8 tiers with prices and full URLs', () => {
    tiers.forEach((tier) => {
      expect(txt).toContain(`${ORIGIN}/v1/validate/${tier}`);
      expect(txt).toContain(TIER_PRICE_USD[tier]);
    });
  });

  it('should include response shape documentation', () => {
    expect(txt).toContain('Response shape');
    expect(txt).toContain('analysisId');
    expect(txt).toContain('summary');
    expect(txt).toContain('categories');
    expect(txt).toContain('validators');
    expect(txt).toContain('verdict');
  });

  it('should include the grade table', () => {
    expect(txt).toContain('Grades');
    expect(txt).toContain('A+');
    expect(txt).toContain('90-100');
    expect(txt).toContain('F');
  });

  it('should include the recommendation table', () => {
    expect(txt).toContain('Recommendation');
    expect(txt).toContain('integrate');
    expect(txt).toContain('caution');
    expect(txt).toContain('avoid');
  });

  it('should include error code documentation', () => {
    expect(txt).toContain('402');
    expect(txt).toContain('422');
    expect(txt).toContain('404');
    expect(txt).toContain('500');
  });

  it('should include caching documentation', () => {
    expect(txt).toContain('ach');
    expect(txt).toContain('refresh');
  });

  it('should include the x402 payment flow', () => {
    expect(txt).toContain('PAYMENT-SIGNATURE');
    expect(txt).toContain('PAYMENT-REQUIRED');
    expect(txt).toContain(`${ORIGIN}/.well-known/x402`);
  });

  it('should include the read endpoints', () => {
    expect(txt).toContain('/v1/validate/:analysisId');
    expect(txt).toContain('/v1/validate/compare/:comparisonId');
    expect(txt).toContain('/v1/health');
  });

  it('should not contain any SiteLenz references', () => {
    expect(txt.toLowerCase()).not.toContain('sitelenz');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// getAgentsMd
// ──────────────────────────────────────────────────────────────────────────────
describe('getAgentsMd', () => {
  let md: string;

  beforeEach(() => {
    md = controller.getAgentsMd(mockFastifyRequest);
  });

  it('should include all tier endpoints and prices', () => {
    tiers.forEach((tier) => {
      expect(md).toContain(`/v1/validate/${tier}`);
      expect(md).toContain(TIER_PRICE_USD[tier]);
    });
  });

  it('should include the x402 payment flow', () => {
    expect(md).toContain('PAYMENT-SIGNATURE');
    expect(md).toContain('PAYMENT-REQUIRED');
    expect(md).toContain('PAYMENT-RESPONSE');
  });

  it('should include a worked example', () => {
    expect(md).toContain('Step 1');
    expect(md).toContain('Step 2');
    expect(md).toContain('Step 3');
  });

  it('should include polling workflow documentation', () => {
    expect(md).toContain('Polling workflow');
    expect(md).toContain('GET /v1/validate/');
  });

  it('should include the grade and recommendation table', () => {
    expect(md).toContain('integrate');
    expect(md).toContain('caution');
    expect(md).toContain('avoid');
    expect(md).toContain('A+');
  });

  it('should include the free read endpoints', () => {
    expect(md).toContain('/v1/validate/:analysisId');
    expect(md).toContain('/v1/validate/compare/:comparisonId');
    expect(md).toContain('/v1/health');
  });

  it('should not contain any SiteLenz references', () => {
    expect(md.toLowerCase()).not.toContain('sitelenz');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// getOpenApi
// ──────────────────────────────────────────────────────────────────────────────
describe('getOpenApi', () => {
  let spec: ReturnType<RootDiscoveryController['getOpenApi']>;

  beforeEach(() => {
    spec = controller.getOpenApi(mockFastifyRequest);
  });

  it('should be valid OpenAPI 3.0', () => {
    expect(spec.openapi).toBe('3.0.3');
    expect(spec.info.title).toBe(SERVICE_NAME);
    expect(spec.info.description).toBe(SERVICE_DESCRIPTION);
  });

  it('should use the request origin as server URL', () => {
    expect(spec.servers[0].url).toBe(ORIGIN);
  });

  it('should include all 8 paid POST endpoints', () => {
    tiers.forEach((tier) => {
      const path = spec.paths[`/v1/validate/${tier}`];
      expect(path).toBeDefined();
      expect(path.post).toBeDefined();
      expect(path.post.operationId).toBe(
        `validate${tier[0].toUpperCase()}${tier.slice(1)}`,
      );
    });
  });

  it('should include Bazaar discovery GET stubs for all paid endpoints', () => {
    tiers.forEach((tier) => {
      const path = spec.paths[`/v1/validate/${tier}`];
      expect(path.get).toBeDefined();
      expect(path.get.tags).toContain('discovery');
    });
  });

  it('should reference TargetRequest schema for single-target tiers', () => {
    const singleTargetTiers = tiers.filter((t) => t !== 'compare');
    singleTargetTiers.forEach((tier) => {
      const body =
        spec.paths[`/v1/validate/${tier}`].post.requestBody.content[
          'application/json'
        ].schema;
      expect(body['$ref']).toBe('#/components/schemas/TargetRequest');
    });
  });

  it('should reference CompareRequest schema for the compare tier', () => {
    const body =
      spec.paths['/v1/validate/compare'].post.requestBody.content[
        'application/json'
      ].schema;
    expect(body['$ref']).toBe('#/components/schemas/CompareRequest');
  });

  it('should include a TargetRequest component with refresh field', () => {
    const schema = spec.components.schemas['TargetRequest'];
    expect(schema).toBeDefined();
    expect(schema.properties['target']).toBeDefined();
    expect(schema.properties['refresh']).toBeDefined();
    expect(schema.properties['refresh'].type).toBe('boolean');
  });

  it('should include an AnalysisReport component schema', () => {
    expect(spec.components.schemas['AnalysisReport']).toBeDefined();
  });

  it('should include error response schemas (402, 422)', () => {
    expect(spec.components.schemas['PaymentRequiredError']).toBeDefined();
    expect(spec.components.schemas['ValidationError']).toBeDefined();
  });

  it('should include the GET /:analysisId read endpoint', () => {
    const path = spec.paths['/v1/validate/{analysisId}'];
    expect(path).toBeDefined();
    expect(path.get).toBeDefined();
    expect(path.get.operationId).toBe('getAnalysis');
    expect(path.get.tags).toContain('read');
  });

  it('should include the GET /compare/:comparisonId read endpoint', () => {
    const path = spec.paths['/v1/validate/compare/{comparisonId}'];
    expect(path).toBeDefined();
    expect(path.get).toBeDefined();
    expect(path.get.operationId).toBe('getComparison');
  });

  it('should include the GET /v1/health endpoint', () => {
    const path = spec.paths['/v1/health'];
    expect(path).toBeDefined();
    expect(path.get.operationId).toBe('getHealth');
    expect(path.get.tags).toContain('infrastructure');
  });

  it('should include x-x402-payment extension on all paid POST operations', () => {
    tiers.forEach((tier) => {
      const op = spec.paths[`/v1/validate/${tier}`].post;
      expect(op['x-x402-payment']).toBeDefined();
      expect(op['x-x402-payment'].protocol).toBe('x402');
      expect(op['x-x402-payment'].network).toBe('algorand');
    });
  });

  it('should not contain any SiteLenz references', () => {
    expect(JSON.stringify(spec).toLowerCase()).not.toContain('sitelenz');
  });
});
