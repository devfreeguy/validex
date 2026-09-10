import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // App
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  ALGORITHM_VERSION: Joi.string().required(),

  // Network
  NETWORK: Joi.string().valid('testnet', 'mainnet').required(),

  // Algorand Mainnet (required only when NETWORK=mainnet)
  ALGO_MAINNET_WALLET_ADDRESS: Joi.string().when('NETWORK', {
    is: 'mainnet',
    then: Joi.required(),
    otherwise: Joi.optional().allow(''),
  }),
  // Kept as a string (not Joi.number()) even though it's numeric on-chain -
  // @x402/core's PaymentRequirements.asset is typed `string`, and the
  // AlgorandConfigService.usdcAssetId contract downstream is also `string`.
  // Joi.number() would coerce this at validation time despite the string
  // type annotation, silently turning "asset" into a JSON number on the
  // wire - the facilitator's string comparison against the decoded
  // transaction's asset ID then fails despite both sides being the same
  // value ("expected 10458941, got 10458941").
  ALGO_MAINNET_USDC_ASSET_ID: Joi.string().default('31566704'),
  ALGO_MAINNET_FACILITATOR_URL: Joi.string().when('NETWORK', {
    is: 'mainnet',
    then: Joi.required(),
    otherwise: Joi.optional().allow(''),
  }),

  // Algorand Testnet (required only when NETWORK=testnet)
  ALGO_TESTNET_WALLET_ADDRESS: Joi.string().when('NETWORK', {
    is: 'testnet',
    then: Joi.required(),
    otherwise: Joi.optional().allow(''),
  }),
  ALGO_TESTNET_USDC_ASSET_ID: Joi.string().default('10458941'),
  ALGO_TESTNET_FACILITATOR_URL: Joi.string().when('NETWORK', {
    is: 'testnet',
    then: Joi.required(),
    otherwise: Joi.optional().allow(''),
  }),

  // GitHub
  GITHUB_TOKEN: Joi.string().required(),

  // Groq
  GROQ_API_KEY: Joi.string().required(),
  GROQ_MODEL: Joi.string().default('openai/gpt-oss-120b'),

  // Database (Neon)
  // DATABASE_URL: pooled/PgBouncer connection, used by Prisma Client at runtime.
  // DATABASE_DIRECT_URL: direct connection, used by Prisma Migrate to bypass PgBouncer.
  DATABASE_URL: Joi.string().required(),
  DATABASE_DIRECT_URL: Joi.string().required(),

  // Redis
  REDIS_URL: Joi.string().required(),
});
