import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HTTPFacilitatorClient, x402ResourceServer } from '@x402/core/server';
import {
  decodePaymentSignatureHeader,
  encodePaymentRequiredHeader,
  encodePaymentResponseHeader,
} from '@x402/core/http';
import type {
  Network,
  PaymentRequired,
  PaymentRequirements,
} from '@x402/core/types';
import { ExactAvmScheme } from '@x402/avm/exact/server';
import {
  bazaarResourceServerExtension,
  declareDiscoveryExtension,
} from '@x402/extensions/bazaar';
import { AlgorandConfigService } from '@/config/algorand.config';
import {
  PAYMENT_TIMEOUT_SECONDS,
  TIER_BAZAAR_META,
  TIER_PRICE_ATOMIC,
  TierKey,
  X402_CHALLENGE_TAG,
} from './x402.constants';

const BAZAAR_SERVICE_NAME = 'Validex';

// x402-merchant has no dedicated helper in @x402/extensions (only `bazaar`
// does) - PaymentRequired.extensions is a plain Record<string, unknown>, so
// this is hand-built from the shape documented at
// https://facilitator.goplausible.xyz/guide/discovery. Declaring it
// controls how the facilitator displays us; omitting it would still work,
// falling back to our root page's OpenGraph tags / llms.txt / agent-card.json.
const X402_MERCHANT_INFO = {
  name: BAZAAR_SERVICE_NAME,
  categories: ['api', 'algorand', 'x402', 'startup-health', 'validation'],
};

const X402_MERCHANT_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: {
    name: { type: 'string' },
    website: { type: 'string', format: 'uri' },
    logo: { type: 'string', format: 'uri' },
    categories: {
      type: 'array',
      items: { type: 'string' },
    },
  },
};

export interface VerifyPaymentResult {
  valid: boolean;
  reason?: string;
}

export interface SettlePaymentResult {
  success: boolean;
  txId?: string;
  /** Base64 header value x402 clients (e.g. @x402/axios) read from the
   * successful response to confirm settlement - see PAYMENT-RESPONSE /
   * X-PAYMENT-RESPONSE in the x402 spec. */
  encodedResponseHeader?: string;
}

/**
 * Never throws from verifyPayment/settlePayment - a malformed or rejected
 * payment is a normal outcome the Fastify hook turns into a 402, not a
 * server error.
 */
@Injectable()
export class X402Service implements OnModuleInit {
  private readonly logger = new Logger(X402Service.name);
  private server!: x402ResourceServer;

  constructor(private readonly algorandConfig: AlgorandConfigService) {}

  async onModuleInit(): Promise<void> {
    const facilitatorClient = new HTTPFacilitatorClient({
      url: this.algorandConfig.facilitatorUrl,
    });

    this.server = new x402ResourceServer(facilitatorClient);
    this.server
      .register(
        this.algorandConfig.caip2Network as Network,
        new ExactAvmScheme(),
      )
      .registerExtension(bazaarResourceServerExtension);

    await this.server.initialize();
    this.logger.log(
      `x402 resource server initialized for ${this.algorandConfig.network} (${this.algorandConfig.caip2Network})`,
    );
  }

  async buildPaymentRequirements(tier: TierKey): Promise<PaymentRequirements> {
    const [requirements] = await this.server.buildPaymentRequirements({
      scheme: 'exact',
      payTo: this.algorandConfig.walletAddress,
      network: this.algorandConfig.caip2Network as Network,
      maxTimeoutSeconds: PAYMENT_TIMEOUT_SECONDS,
      price: {
        asset: this.algorandConfig.usdcAssetId,
        amount: TIER_PRICE_ATOMIC[tier],
      },
      extra: {
        decimals: 6,
        tag: X402_CHALLENGE_TAG,
      },
    });
    return requirements;
  }

  /**
   * Full 402 response body, including the Bazaar discovery extension so the
   * endpoint is catalogued for the competition. `resourceUrl` should be the
   * fully-qualified URL of the route being paywalled.
   */
  async buildPaymentRequiredResponse(
    tier: TierKey,
    resourceUrl: string,
    requirements?: PaymentRequirements,
  ): Promise<PaymentRequired> {
    const resolvedRequirements =
      requirements ?? (await this.buildPaymentRequirements(tier));
    const meta = TIER_BAZAAR_META[tier];

    // Every endpoint is individually discoverable with its own body schema -
    // all of them take a single `target` string except compare, which takes
    // a `targets` array (2-5 domains) instead.
    const baseDeclared =
      tier === 'compare'
        ? declareDiscoveryExtension({
            bodyType: 'json',
            input: { targets: ['stripe.com', 'github.com'] },
            inputSchema: {
              type: 'object',
              properties: {
                targets: {
                  type: 'array',
                  items: { type: 'string' },
                  minItems: 2,
                  maxItems: 5,
                  description:
                    'Array of 2 to 5 bare domains or full URLs to compare.',
                },
                refresh: {
                  type: 'boolean',
                  default: false,
                  description: 'Bypass validator result cache when true.',
                },
              },
              required: ['targets'],
            },
            output: {
              example: {
                success: true,
                data: {
                  meta: {
                    comparisonId: 'cmp_01j8z9k3n8v5w6x7y8z9a0b1c2',
                    generatedAt: '2026-09-12T00:00:00.000Z',
                    targetCount: 2,
                  },
                  ranking: [
                    {
                      rank: 1,
                      domain: 'stripe.com',
                      score: 92,
                      grade: 'A',
                      confidence: 0.85,
                      analysisId: 'sl_an_01j8z9k3n8v5w6x7y8z9a0b1c2',
                    },
                    {
                      rank: 2,
                      domain: 'github.com',
                      score: 88,
                      grade: 'B',
                      confidence: 0.82,
                      analysisId: 'sl_an_01j8z9k3n8v5w6x7y8z9a0b1c3',
                    },
                  ],
                },
              },
            },
          })
        : declareDiscoveryExtension({
            bodyType: 'json',
            input: { target: 'stripe.com' },
            inputSchema: {
              type: 'object',
              properties: {
                target: {
                  type: 'string',
                  description:
                    'Bare domain or full URL of the startup to validate (e.g. "stripe.com").',
                },
                refresh: {
                  type: 'boolean',
                  default: false,
                  description: 'Bypass validator result cache when true.',
                },
              },
              required: ['target'],
            },
            output: {
              example: {
                success: true,
                data: {
                  meta: {
                    analysisId: 'sl_an_01j8z9k3n8v5w6x7y8z9a0b1c2',
                    algorithmVersion: '1.0.0',
                    generatedAt: '2026-09-12T00:00:00.000Z',
                    cached: false,
                    tier,
                  },
                  company: {
                    domain: 'stripe.com',
                    canonicalUrl: 'https://stripe.com',
                    companyName: 'Stripe',
                    githubRepo: 'stripe',
                  },
                  summary: {
                    score: 92,
                    grade: 'A',
                    confidence: 0.85,
                  },
                },
              },
            },
          });

    const parsedUrl = new URL(resourceUrl);
    const enrichFn = bazaarResourceServerExtension.enrichDeclaration;
    const enrichedBazaar = enrichFn
      ? enrichFn(baseDeclared.bazaar, {
          method: 'POST',
          url: resourceUrl,
          adapter: {
            getMethod: () => 'POST',
            getPath: () => parsedUrl.pathname,
          },
        })
      : baseDeclared.bazaar;

    const origin = parsedUrl.origin;
    const extensions = {
      bazaar: enrichedBazaar,
      'x402-merchant': {
        info: {
          ...X402_MERCHANT_INFO,
          website: origin,
          logo: `${origin}/apple-touch-icon.png`,
        },
        schema: X402_MERCHANT_SCHEMA,
      },
    };

    return this.server.createPaymentRequiredResponse(
      [resolvedRequirements],
      {
        url: resourceUrl,
        serviceName: meta.serviceName,
        description: meta.description,
        tags: meta.tags,
        iconUrl: `${origin}/apple-touch-icon.png`,
      },
      'Payment required',
      extensions,
    );
  }

  /**
   * x402 v2 clients (e.g. @x402/axios's x402HTTPClient.getPaymentRequiredResponse)
   * read the payment requirements off a PAYMENT-REQUIRED response header,
   * not the JSON body - the body is still sent alongside it for the Bazaar
   * crawler and for anything reading the response by hand. Without this
   * header a spec-compliant x402 client can't complete a payment at all.
   */
  buildPaymentRequiredHeader(paymentRequired: PaymentRequired): string {
    return encodePaymentRequiredHeader(paymentRequired);
  }

  async verifyPayment(
    paymentHeader: string,
    requirements: PaymentRequirements,
  ): Promise<VerifyPaymentResult> {
    try {
      const payload = decodePaymentSignatureHeader(paymentHeader);
      const result = await this.server.verifyPayment(payload, requirements);
      return { valid: result.isValid, reason: result.invalidReason };
    } catch (err) {
      this.logger.debug(`Payment verification failed: ${String(err)}`);
      return {
        valid: false,
        reason: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async settlePayment(
    paymentHeader: string,
    requirements: PaymentRequirements,
  ): Promise<SettlePaymentResult> {
    try {
      const payload = decodePaymentSignatureHeader(paymentHeader);
      const result = await this.server.settlePayment(payload, requirements);
      return {
        success: result.success,
        txId: result.transaction,
        encodedResponseHeader: encodePaymentResponseHeader(result),
      };
    } catch (err) {
      this.logger.debug(`Payment settlement failed: ${String(err)}`);
      return { success: false };
    }
  }
}
