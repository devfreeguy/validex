import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ConfigService } from '@nestjs/config';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppModule } from './app.module';
import { X402Service } from '@/x402/x402.service';
import {
  DISCOVERY_ROUTES,
  PAYMENT_HEADER,
  PROTECTED_ROUTES,
  type TierKey,
} from '@/x402/x402.constants';

/**
 * Shared by the real payment-gated routes and the x402 Bazaar discovery
 * GETs (see DISCOVERY_ROUTES) so there is exactly one place that builds
 * requirements, checks PAYMENT-SIGNATURE, verifies, and settles - never two copies
 * of the payment logic to keep in sync. `tier` always comes from a route
 * table, never from the request body, so this works identically whether
 * the caller sent a real POST or the crawler sent a bare GET.
 */
async function enforceX402Payment(
  x402Service: X402Service,
  tier: TierKey,
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const requirements = await x402Service.buildPaymentRequirements(tier);

  const rawHeader = request.headers[PAYMENT_HEADER];
  const paymentHeader = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

  if (!paymentHeader) {
    const resourceUrl = `${request.protocol}://${request.hostname}${request.url}`;
    const body = await x402Service.buildPaymentRequiredResponse(
      tier,
      resourceUrl,
      requirements,
    );
    // The JSON body is what the Bazaar crawler and humans read, but x402 v2
    // clients (e.g. @x402/axios) resolve payment requirements from the
    // PAYMENT-REQUIRED header specifically - without it they can't actually
    // pay, even though the 402 status and body look correct.
    await reply
      .code(402)
      .header('Content-Type', 'application/json')
      .header('PAYMENT-REQUIRED', x402Service.buildPaymentRequiredHeader(body))
      .send(body);
    return;
  }

  const verifyResult = await x402Service.verifyPayment(
    paymentHeader,
    requirements,
  );
  if (!verifyResult.valid) {
    await reply
      .code(402)
      .header('Content-Type', 'application/json')
      .send({ error: verifyResult.reason ?? 'Invalid payment' });
    return;
  }

  const settleResult = await x402Service.settlePayment(
    paymentHeader,
    requirements,
  );
  if (!settleResult.success) {
    await reply
      .code(402)
      .header('Content-Type', 'application/json')
      .send({ error: 'Settlement failed' });
    return;
  }

  // These are response headers, not request headers - the request object
  // has already been read by this point, so mutating its headers would
  // never reach the client. x402 client libraries (e.g. @x402/axios) read
  // PAYMENT-RESPONSE/X-PAYMENT-RESPONSE off the response to confirm
  // settlement.
  if (settleResult.encodedResponseHeader) {
    reply.header('PAYMENT-RESPONSE', settleResult.encodedResponseHeader);
    reply.header('X-PAYMENT-RESPONSE', settleResult.encodedResponseHeader);
  }
  if (settleResult.txId) {
    reply.header('X-PAYMENT-TX-ID', settleResult.txId);
  }
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true }),
    { bufferLogs: true },
  );

  app.useLogger(app.get(Logger));
  app.useGlobalInterceptors(new LoggerErrorInterceptor());

  // Every x402/agent discovery file must live at the literal domain root
  // (not under /v1) for the various crawlers/spec readers to find it -
  // excluded from the /v1 prefix rather than moved out of Nest entirely, so
  // they still go through the normal Nest pipeline (unlike the raw-Fastify
  // payment hook below, which has to sit outside Nest's routing for
  // unrelated reasons). See WellKnownController/RootDiscoveryController.
  const DISCOVERY_ROOT_PATHS = [
    '',
    '.well-known/x402',
    '.well-known/agent-card.json',
    '.well-known/agent.json',
    '.well-known/ai-plugin.json',
    '.well-known/mcp.json',
    'llms.txt',
    'agents.md',
    'robots.txt',
    'favicon-32.png',
    'apple-touch-icon.png',
    'og.png',
    'openapi.json',
  ];
  app.setGlobalPrefix('v1', {
    exclude: DISCOVERY_ROOT_PATHS.map((path) => ({
      path,
      method: RequestMethod.GET,
    })),
  });

  // This is a public, payment-gated API meant to be called from arbitrary
  // browser-based clients (including our own /app) and AI agents - there's
  // no cookie/session auth to protect, so allow any origin. allowedHeaders
  // is left unset so @fastify/cors reflects back whatever the browser's
  // preflight actually requested (covers the custom PAYMENT-SIGNATURE
  // header and whatever else an x402 client library sends) instead of an
  // incomplete hardcoded list.
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    exposedHeaders: [
      'PAYMENT-REQUIRED',
      'PAYMENT-RESPONSE',
      'X-PAYMENT-RESPONSE',
      'X-PAYMENT-TX-ID',
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // X402Service.onModuleInit (registers the AVM scheme and fetches the
  // facilitator's supported kinds) must have run before the hook below can
  // build payment requirements, so the app must be fully initialized first.
  await app.init();

  const x402Service = app.get(X402Service);
  const fastify = app.getHttpAdapter().getInstance();

  // Keyed by both PROTECTED_ROUTES (the real paid POST routes) and
  // DISCOVERY_ROUTES (their GET counterparts - see x402.constants.ts for
  // why those exist). Nest's Fastify adapter already owns the instance's
  // one-and-only not-found handler, so unlike the POST routes, the GET
  // discovery routes only reach this hook because ValidateController
  // registers real (intentionally unreachable) handlers for them - Fastify
  // never runs `preHandler` for a route it hasn't matched.
  fastify.addHook(
    'preHandler',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const routeKey = `${request.method} ${request.url.split('?')[0]}`;
      const tier = PROTECTED_ROUTES[routeKey] ?? DISCOVERY_ROUTES[routeKey];
      if (!tier) return;
      await enforceX402Payment(x402Service, tier, request, reply);
    },
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3000;

  await app.listen(port, '0.0.0.0');
}

void bootstrap();
