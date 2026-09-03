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
  ALGO_MAINNET_USDC_ASSET_ID: Joi.number().default(31566704),
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
  ALGO_TESTNET_USDC_ASSET_ID: Joi.number().default(10458941),
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

  // Database
  DATABASE_URL: Joi.string().required(),

  // Redis
  REDIS_URL: Joi.string().required(),
});
