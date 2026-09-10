import { Controller, Get, Header, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { TIER_PRICE_ATOMIC, TierKey } from '@/x402/x402.constants';
import {
  SERVICE_DESCRIPTION,
  SERVICE_NAME,
  TIER_DESCRIPTIONS,
  TIER_PRICE_USD,
} from './well-known.constants';
import { originOf } from './origin.util';
import { solidColorPng } from './png.util';
import { loadLogoPng } from './logo-asset';

const BRAND_WINE: [number, number, number] = [0x38, 0x17, 0x24];

// Falls back to a plain brand-color square only if assets/logo.png is ever
// missing (e.g. a broken checkout) - deliberately no invented mark/glyph.
const FALLBACK_ICON_PNG = solidColorPng(180, 180, BRAND_WINE);
const OG_IMAGE_PNG = solidColorPng(1200, 630, BRAND_WINE);

const LOGO_PNG = loadLogoPng() ?? FALLBACK_ICON_PNG;

/**
 * Root-level discoverability surface: OpenGraph/meta tags, favicons,
 * llms.txt, agents.md and robots.txt. The x402 facilitator falls back to
 * this domain metadata (og:title, <title>, apple-touch-icon, etc.) for
 * merchant identity whenever a resource omits the x402-merchant extension -
 * see the "Discovery Precedence" section of
 * https://facilitator.goplausible.xyz/guide/discovery. We declare
 * x402-merchant explicitly (see x402.service.ts) so this is the fallback
 * path, not the primary one, but it still needs to be correct.
 *
 * Kept as its own controller (rather than folded into WellKnownController)
 * because these routes live at the literal root, not under /.well-known -
 * both are excluded from the /v1 prefix in main.ts.
 */
@Controller()
export class RootDiscoveryController {
  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  getRootPage(@Req() request: FastifyRequest): string {
    const origin = originOf(request);
    const title = `${SERVICE_NAME} - startup validation, paid per call`;

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<meta name="description" content="${SERVICE_DESCRIPTION}" />
<meta name="theme-color" content="#381724" />
<meta property="og:site_name" content="${SERVICE_NAME}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${SERVICE_DESCRIPTION}" />
<meta property="og:image" content="${origin}/og.png" />
<meta property="og:url" content="${origin}" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
</head>
<body>
<h1>${SERVICE_NAME}</h1>
<p>${SERVICE_DESCRIPTION}</p>
<p>Paid per call via the x402 protocol on Algorand. See <a href="/.well-known/x402">/.well-known/x402</a> for machine-readable pricing, or <a href="/llms.txt">/llms.txt</a> for agent-oriented docs.</p>
</body>
</html>`;
  }

  @Get('llms.txt')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  getLlmsTxt(@Req() request: FastifyRequest): string {
    const origin = originOf(request);
    const tiers = Object.keys(TIER_PRICE_ATOMIC) as TierKey[];

    const lines = [
      `# ${SERVICE_NAME}`,
      '',
      SERVICE_DESCRIPTION,
      '',
      '## Payment',
      '',
      `Every endpoint below is paid per call via the x402 protocol (Algorand, USDC). Call it without a PAYMENT-SIGNATURE header to receive a 402 with payment requirements (also available unconditionally at ${origin}/.well-known/x402), sign a payment against them, then retry with the signature on the PAYMENT-SIGNATURE header.`,
      '',
      '## Endpoints',
      '',
      ...tiers.flatMap((tier) => [
        `### POST ${origin}/v1/validate/${tier} - ${TIER_PRICE_USD[tier]}`,
        '',
        TIER_DESCRIPTIONS[tier],
        '',
        tier === 'compare'
          ? 'Request body: { "targets": ["example.com", "other.com"] } (2-5 domains)'
          : 'Request body: { "target": "example.com" }',
        '',
      ]),
      '## Other resources',
      '',
      `- ${origin}/.well-known/x402 - machine-readable pricing manifest`,
      `- ${origin}/.well-known/agent-card.json - A2A agent card`,
      `- ${origin}/.well-known/agent.json - generic agent manifest`,
      `- ${origin}/.well-known/ai-plugin.json - plugin manifest`,
      `- ${origin}/.well-known/mcp.json - MCP tool manifest`,
      `- ${origin}/openapi.json - OpenAPI spec for the endpoints above`,
      `- ${origin}/agents.md - operating instructions for autonomous agents`,
    ];

    return lines.join('\n');
  }

  @Get('agents.md')
  @Header('Content-Type', 'text/markdown; charset=utf-8')
  getAgentsMd(@Req() request: FastifyRequest): string {
    const origin = originOf(request);
    const tiers = Object.keys(TIER_PRICE_ATOMIC) as TierKey[];

    return `# ${SERVICE_NAME} - agent operating instructions

${SERVICE_DESCRIPTION}

## Payment flow (x402, Algorand)

1. Call an endpoint below with no payment. You get back \`402 Payment Required\` with a \`PAYMENT-REQUIRED\` header (and a JSON body) describing the price, asset, and \`payTo\` address.
2. Sign a payment against those requirements and retry the same request with the signature on the \`PAYMENT-SIGNATURE\` header.
3. On success you get your response back plus a \`PAYMENT-RESPONSE\` header confirming settlement.

Unconditional pricing (no round trip needed) is at [\`/.well-known/x402\`](${origin}/.well-known/x402).

## Endpoints

${tiers.map((tier) => `- \`POST ${origin}/v1/validate/${tier}\` (${TIER_PRICE_USD[tier]}) - ${TIER_DESCRIPTIONS[tier]}`).join('\n')}

## Notes

- Network and USDC asset ID are declared per-deployment in \`/.well-known/x402\` (\`network\`/\`asset\` fields) - don't hardcode testnet/mainnet assumptions.
- The facilitator co-signs as fee payer, so you only need USDC (opted in) - no ALGO required for fees.
`;
  }

  @Get('robots.txt')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  getRobotsTxt(): string {
    return 'User-agent: *\nAllow: /\n';
  }

  @Get('favicon-32.png')
  @Header('Content-Type', 'image/png')
  getFavicon32(): Buffer {
    return LOGO_PNG;
  }

  @Get('apple-touch-icon.png')
  @Header('Content-Type', 'image/png')
  getAppleTouchIcon(): Buffer {
    return LOGO_PNG;
  }

  @Get('og.png')
  @Header('Content-Type', 'image/png')
  getOgImage(): Buffer {
    return OG_IMAGE_PNG;
  }

  // Minimal hand-authored spec covering just the paid endpoints - enough
  // for ai-plugin.json's required api.url, without pulling in
  // @nestjs/swagger and annotating every controller in the app.
  @Get('openapi.json')
  getOpenApi(@Req() request: FastifyRequest) {
    const origin = originOf(request);
    const tiers = Object.keys(TIER_PRICE_ATOMIC) as TierKey[];

    return {
      openapi: '3.0.3',
      info: {
        title: SERVICE_NAME,
        description: SERVICE_DESCRIPTION,
        version: '1.0.0',
      },
      servers: [{ url: origin }],
      paths: Object.fromEntries(
        tiers.map((tier) => [
          `/v1/validate/${tier}`,
          {
            post: {
              operationId: `validate${tier[0].toUpperCase()}${tier.slice(1)}`,
              summary: TIER_DESCRIPTIONS[tier],
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema:
                      tier === 'compare'
                        ? {
                            type: 'object',
                            required: ['targets'],
                            properties: {
                              targets: {
                                type: 'array',
                                items: { type: 'string' },
                                minItems: 2,
                                maxItems: 5,
                              },
                            },
                          }
                        : {
                            type: 'object',
                            required: ['target'],
                            properties: { target: { type: 'string' } },
                          },
                  },
                },
              },
              responses: {
                '200': { description: 'Validation report' },
                '402': { description: 'Payment required (x402)' },
              },
            },
          },
        ]),
      ),
    };
  }
}
