import { Controller, Get, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { AlgorandConfigService } from '@/config/algorand.config';
import {
  TIER_BAZAAR_META,
  TIER_PRICE_ATOMIC,
  TierKey,
  X402_CHALLENGE_TAG,
} from '@/x402/x402.constants';
import {
  SERVICE_DESCRIPTION,
  SERVICE_NAME,
  TIER_DESCRIPTIONS,
  TIER_PRICE_USD,
  TIER_SUMMARY,
} from './well-known.constants';
import { originOf } from './origin.util';

/**
 * The x402 Bazaar discovery crawler and several adjacent agent ecosystems
 * (A2A, ChatGPT plugins, MCP) each read their own manifest from
 * /.well-known/*  - separate from (and in addition to) the bazaar extension
 * embedded in each 402 response, which only catalogs a resource after its
 * first settled payment. See
 * https://facilitator.goplausible.xyz/guide/discovery.
 *
 * All excluded from the /v1 global prefix in main.ts because every one of
 * these specs expects the literal /.well-known/<file> path on the domain
 * root, not under an API-versioned subpath.
 */
@Controller('.well-known')
export class WellKnownController {
  constructor(private readonly algorandConfig: AlgorandConfigService) {}

  @Get('x402')
  getX402Manifest(@Req() request: FastifyRequest) {
    const origin = originOf(request);
    const tiers = Object.keys(TIER_PRICE_ATOMIC) as TierKey[];

    return {
      x402Version: 2,
      name: SERVICE_NAME,
      description: SERVICE_DESCRIPTION,
      resources: tiers.map((tier) => ({
        url: `${origin}/v1/validate/${tier}`,
        method: 'POST',
        description: TIER_DESCRIPTIONS[tier],
        network: this.algorandConfig.caip2Network,
        asset: this.algorandConfig.usdcAssetId,
        amount: TIER_PRICE_ATOMIC[tier],
        payTo: this.algorandConfig.walletAddress,
        extra: {
          tag: X402_CHALLENGE_TAG,
        },
      })),
    };
  }

  // A2A agent card - https://a2aproject.github.io/A2A/latest/specification/#55-agentcard
  @Get('agent-card.json')
  getAgentCard(@Req() request: FastifyRequest) {
    const origin = originOf(request);
    const tiers = Object.keys(TIER_PRICE_ATOMIC) as TierKey[];

    return {
      name: SERVICE_NAME,
      description: SERVICE_DESCRIPTION,
      url: origin,
      version: '1.0.0',
      capabilities: { streaming: false },
      defaultInputModes: ['application/json'],
      defaultOutputModes: ['application/json'],
      // x402 v2 on Algorand USDC is the payment mechanism - agents must
      // acquire payment requirements from /.well-known/x402 or from the
      // 402 response before calling any skill endpoint.
      authentication: {
        type: 'x402',
        protocol: 'x402',
        version: 2,
        network: 'algorand',
        asset: 'USDC',
        pricingManifest: `${origin}/.well-known/x402`,
        paymentHeader: 'PAYMENT-SIGNATURE',
        description:
          'Call without PAYMENT-SIGNATURE to receive a 402 with PAYMENT-REQUIRED header. Sign against those requirements and retry with the signature on PAYMENT-SIGNATURE.',
      },
      skills: tiers.map((tier) => ({
        id: `validate-${tier}`,
        name: TIER_BAZAAR_META[tier].serviceName,
        description: TIER_SUMMARY[tier],
        tags: ['x402', 'algorand', 'validation', X402_CHALLENGE_TAG],
        // inputSchema lets tool-calling agents construct valid requests
        // without consulting external documentation.
        inputSchema:
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
                    description:
                      'Array of 2-5 bare domains or full URLs to compare.',
                    example: ['stripe.com', 'github.com'],
                  },
                  refresh: {
                    type: 'boolean',
                    default: false,
                    description: 'Bypass validator result cache when true.',
                  },
                },
              }
            : {
                type: 'object',
                required: ['target'],
                properties: {
                  target: {
                    type: 'string',
                    description:
                      'Bare domain or full URL of the startup to validate (e.g. "stripe.com").',
                    example: 'stripe.com',
                  },
                  refresh: {
                    type: 'boolean',
                    default: false,
                    description: 'Bypass validator result cache when true.',
                  },
                },
              },
      })),
    };
  }

  // Generic agent manifest, as described alongside agent-card.json/ai-plugin.json
  // in the goplausible discovery guide.
  @Get('agent.json')
  getAgentManifest(@Req() request: FastifyRequest) {
    const origin = originOf(request);

    return {
      name: SERVICE_NAME,
      description: SERVICE_DESCRIPTION,
      url: origin,
      documentation: `${origin}/llms.txt`,
      payments: {
        protocol: 'x402',
        network: 'algorand',
        asset: 'USDC',
      },
    };
  }

  // Legacy ChatGPT-plugin manifest shape - still widely used as a generic
  // "how do I call this API" declaration by non-ChatGPT agent tooling too.
  @Get('ai-plugin.json')
  getAiPlugin(@Req() request: FastifyRequest) {
    const origin = originOf(request);

    return {
      schema_version: 'v1',
      name_for_human: SERVICE_NAME,
      name_for_model: 'validex',
      description_for_human: SERVICE_DESCRIPTION,
      description_for_model:
        'Call Validex to validate a startup domain (reachability, TLS, DNS, security headers, and optionally GitHub/website/growth signals). Each call is paid via the x402 protocol (Algorand, USDC) - fetch /.well-known/x402 for machine-readable pricing and payment requirements before calling.',
      api: {
        type: 'openapi',
        url: `${origin}/openapi.json`,
      },
      logo_url: `${origin}/apple-touch-icon.png`,
    };
  }

  // MCP tool manifest. No live MCP transport (SSE/stdio) is exposed yet, so
  // this deliberately omits a `transport` block rather than advertise one
  // that would 404 - each tool instead links straight to the real HTTP
  // endpoint it maps to. inputSchema is included per tool so an MCP client
  // can construct a valid request body without consulting separate docs.
  @Get('mcp.json')
  getMcpManifest(@Req() request: FastifyRequest) {
    const origin = originOf(request);
    const tiers = Object.keys(TIER_PRICE_ATOMIC) as TierKey[];

    return {
      name: `${SERVICE_NAME} MCP`,
      description: `${SERVICE_DESCRIPTION}. Tools below are plain x402-paid HTTP endpoints, not (yet) served over a dedicated MCP transport.`,
      version: '1.0.0',
      tools: tiers.map((tier) => ({
        name: `validate_${tier}`,
        description: `${TIER_SUMMARY[tier]} Paid per call via x402 (Algorand USDC). Price: ${TIER_PRICE_USD[tier]}.`,
        endpoint: `${origin}/v1/validate/${tier}`,
        method: 'POST',
        inputSchema:
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
                    description:
                      'Array of 2-5 bare domains or full URLs to compare.',
                    example: ['stripe.com', 'github.com'],
                  },
                  refresh: {
                    type: 'boolean',
                    default: false,
                    description: 'Bypass validator result cache when true.',
                  },
                },
              }
            : {
                type: 'object',
                required: ['target'],
                properties: {
                  target: {
                    type: 'string',
                    description:
                      'Bare domain or full URL of the startup to validate (e.g. "stripe.com").',
                    example: 'stripe.com',
                  },
                  refresh: {
                    type: 'boolean',
                    default: false,
                    description: 'Bypass validator result cache when true.',
                  },
                },
              },
      })),
    };
  }
}
