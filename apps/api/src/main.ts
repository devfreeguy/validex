import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppModule } from './app.module';
import { X402Service } from '@/x402/x402.service';
import { PAYMENT_HEADER, PROTECTED_ROUTES } from '@/x402/x402.constants';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true }),
    { bufferLogs: true },
  );

  app.useLogger(app.get(Logger));
  app.useGlobalInterceptors(new LoggerErrorInterceptor());

  app.setGlobalPrefix('v1');

  // This is a public, payment-gated API meant to be called from arbitrary
  // browser-based clients (including our own /app) and AI agents - there's
  // no cookie/session auth to protect, so allow any origin. allowedHeaders
  // is left unset so @fastify/cors reflects back whatever the browser's
  // preflight actually requested (covers the custom X-PAYMENT header and
  // whatever else an x402 client library sends) instead of an incomplete
  // hardcoded list.
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    exposedHeaders: [
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

  fastify.addHook(
    'preHandler',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const routeKey = `${request.method} ${request.url.split('?')[0]}`;
      const tier = PROTECTED_ROUTES[routeKey];
      if (!tier) return;

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
        await reply
          .code(402)
          .header('Content-Type', 'application/json')
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

      // These are response headers, not request headers - the request
      // object has already been read by this point, so mutating its
      // headers would never reach the client. x402 client libraries (e.g.
      // @x402/axios) read PAYMENT-RESPONSE/X-PAYMENT-RESPONSE off the
      // response to confirm settlement.
      if (settleResult.encodedResponseHeader) {
        reply.header('PAYMENT-RESPONSE', settleResult.encodedResponseHeader);
        reply.header('X-PAYMENT-RESPONSE', settleResult.encodedResponseHeader);
      }
      if (settleResult.txId) {
        reply.header('X-PAYMENT-TX-ID', settleResult.txId);
      }
    },
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3000;

  await app.listen(port, '0.0.0.0');
}

void bootstrap();
