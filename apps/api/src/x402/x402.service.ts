import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HTTPFacilitatorClient, x402ResourceServer } from '@x402/core/server';
import { decodePaymentSignatureHeader } from '@x402/core/http';
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
  TIER_PRICE_ATOMIC,
  ValidateTier,
} from './x402.constants';

const BAZAAR_SERVICE_NAME = 'Validex';
const BAZAAR_DESCRIPTION =
  'Startup health and validation API for AI agents and developers';
const BAZAAR_TAGS = [
  'x402-global-challenge',
  'validation',
  'startup-health',
  'api',
];

export interface VerifyPaymentResult {
  valid: boolean;
  reason?: string;
}

export interface SettlePaymentResult {
  success: boolean;
  txId?: string;
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

  async buildPaymentRequirements(
    tier: ValidateTier,
  ): Promise<PaymentRequirements> {
    const [requirements] = await this.server.buildPaymentRequirements({
      scheme: 'exact',
      payTo: this.algorandConfig.walletAddress,
      network: this.algorandConfig.caip2Network as Network,
      maxTimeoutSeconds: PAYMENT_TIMEOUT_SECONDS,
      price: {
        asset: this.algorandConfig.usdcAssetId,
        amount: TIER_PRICE_ATOMIC[tier],
      },
      extra: { decimals: 6 },
    });
    return requirements;
  }

  /**
   * Full 402 response body, including the Bazaar discovery extension so the
   * endpoint is catalogued for the competition. `resourceUrl` should be the
   * fully-qualified URL of the route being paywalled.
   */
  async buildPaymentRequiredResponse(
    tier: ValidateTier,
    resourceUrl: string,
    requirements?: PaymentRequirements,
  ): Promise<PaymentRequired> {
    const resolvedRequirements =
      requirements ?? (await this.buildPaymentRequirements(tier));

    const declaredExtensions = declareDiscoveryExtension({
      bodyType: 'json',
      input: { target: 'stripe.com' },
      inputSchema: {
        properties: { target: { type: 'string' } },
        required: ['target'],
      },
      output: {
        example: { success: true },
      },
    });

    return this.server.createPaymentRequiredResponse(
      [resolvedRequirements],
      {
        url: resourceUrl,
        serviceName: BAZAAR_SERVICE_NAME,
        description: BAZAAR_DESCRIPTION,
        tags: BAZAAR_TAGS,
      },
      'Payment required',
      declaredExtensions,
    );
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
      return { success: result.success, txId: result.transaction };
    } catch (err) {
      this.logger.debug(`Payment settlement failed: ${String(err)}`);
      return { success: false };
    }
  }
}
