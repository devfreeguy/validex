export type TierKey =
  | 'security'
  | 'trust'
  | 'web'
  | 'engineering'
  | 'ai'
  | 'compare'
  | 'quick'
  | 'full';

// x402 v2 clients (e.g. @x402/axios) send the signed payment on the
// PAYMENT-SIGNATURE header, not the legacy v1 X-PAYMENT header - our 402
// responses declare x402Version: 2, so this must match what a real v2
// client actually sends back (verified against @x402/core's own
// extractPayment(), which checks this exact header name).
export const PAYMENT_HEADER = 'payment-signature';

export const PROTECTED_ROUTES: Record<string, TierKey> = {
  'POST /v1/validate/security': 'security',
  'POST /v1/validate/trust': 'trust',
  'POST /v1/validate/web': 'web',
  'POST /v1/validate/engineering': 'engineering',
  'POST /v1/validate/ai': 'ai',
  'POST /v1/validate/compare': 'compare',
  'POST /v1/validate/quick': 'quick',
  'POST /v1/validate/full': 'full',
};

// The x402 Bazaar discovery crawler catalogs a resource by sending a bare
// GET to its URL and checking whether it gets a 402 back - it never issues
// the real POST. Our paid routes are POST-only, so without a GET-reachable
// counterpart for each one, the crawler gets a 404 and can never list us.
// ValidateController registers a real (intentionally unreachable) GET
// handler for each of these paths purely so Fastify has a route to match;
// the preHandler hook in main.ts is what actually turns the request into a
// 402, using this table. Derived from PROTECTED_ROUTES (not hand-
// duplicated) so a new paid POST route can't silently ship without a
// discovery counterpart.
export const DISCOVERY_ROUTES: Record<string, TierKey> = Object.fromEntries(
  Object.entries(PROTECTED_ROUTES)
    .filter(([routeKey]) => routeKey.startsWith('POST '))
    .map(([routeKey, tier]) => [routeKey.replace(/^POST /, 'GET '), tier]),
);

// USDC has 6 decimal places - amounts are atomic units. Compare is priced
// flat per call regardless of target count (2-5) - never multiplied.
export const TIER_PRICE_ATOMIC: Record<TierKey, string> = {
  security: '50000',
  trust: '50000',
  web: '60000',
  engineering: '80000',
  ai: '150000',
  compare: '150000',
  quick: '200000',
  full: '350000',
};

export const PAYMENT_TIMEOUT_SECONDS = 300;

/**
 * Per-endpoint Bazaar ResourceInfo (see X402Service.buildPaymentRequiredResponse).
 * Single source of truth reused by both the 402 discovery declaration and
 * the /.well-known/* manifests (WellKnownController), so a tier's identity
 * only needs to change in one place. Every endpoint carries
 * "x402-global-challenge" per the competition requirement.
 */
export const TIER_BAZAAR_META: Record<
  TierKey,
  { serviceName: string; description: string; tags: string[] }
> = {
  security: {
    serviceName: 'Validex Security Check',
    description:
      'Audits SSL and TLS certificates, HTTP security headers such as HSTS and CSP, SPF, DMARC, MX email records, and DNS configuration.',
    tags: ['x402-global-challenge', 'security', 'validation'],
  },
  trust: {
    serviceName: 'Validex Trust Check',
    description:
      'Evaluates HTTPS enforcement, domain registration age, WHOIS records, privacy policy, and terms of service documentation.',
    tags: ['x402-global-challenge', 'trust', 'validation'],
  },
  web: {
    serviceName: 'Validex Web Presence Check',
    description:
      'Inspects online presence including pricing transparency, developer documentation, engineering blog, careers page, and contact channels.',
    tags: ['x402-global-challenge', 'web', 'validation'],
  },
  engineering: {
    serviceName: 'Validex Engineering Check',
    description:
      'Analyzes public GitHub repository activity, commit frequency, contributor diversity, release cadence, and OSV known vulnerabilities.',
    tags: ['x402-global-challenge', 'engineering', 'validation'],
  },
  ai: {
    serviceName: 'Validex AI Analysis',
    description:
      'Executes full multi-category validation with an AI-generated startup health verdict, risk factor analysis, and integration recommendations.',
    tags: ['x402-global-challenge', 'ai', 'validation', 'startup-health'],
  },
  compare: {
    serviceName: 'Validex Compare',
    description:
      'Performs comparative analysis and health ranking across 2 to 5 startup domains with relative scoring across all categories.',
    tags: ['x402-global-challenge', 'compare', 'validation'],
  },
  quick: {
    serviceName: 'Validex Quick Validation',
    description:
      'Performs fast-path network connectivity, TLS certificate, security header, and domain trust validation combined with an AI summary.',
    tags: ['x402-global-challenge', 'validation', 'startup-health'],
  },
  full: {
    serviceName: 'Validex Full Validation',
    description:
      'Conducts a deep audit across all six signal categories including security, trust, web, and engineering with full evidence and AI interpretation.',
    tags: ['x402-global-challenge', 'validation', 'startup-health'],
  },
};
