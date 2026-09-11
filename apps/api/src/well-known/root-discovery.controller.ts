import { Controller, Get, Header, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { TIER_PRICE_ATOMIC, TierKey } from '@/x402/x402.constants';
import {
  SERVICE_DESCRIPTION,
  SERVICE_NAME,
  TIER_BODY_HINT,
  TIER_PRICE_USD,
  TIER_SUMMARY,
} from './well-known.constants';
import { originOf } from './origin.util';
import { solidColorPng } from './png.util';
import { loadLogoPng, loadOgImagePng } from './logo-asset';

const BRAND_WINE: [number, number, number] = [0x38, 0x17, 0x24];

// Falls back to a plain brand-color square only if assets/logo.png is ever
// missing (e.g. a broken checkout) - deliberately no invented mark/glyph.
const FALLBACK_ICON_PNG = solidColorPng(180, 180, BRAND_WINE);
// Fallback only - the real og-image.png from assets/ is preferred. The flat
// color is an acceptable placeholder if the asset file is missing.
const FALLBACK_OG_PNG = solidColorPng(1200, 630, BRAND_WINE);

const LOGO_PNG = loadLogoPng() ?? FALLBACK_ICON_PNG;
const OG_IMAGE_PNG = loadOgImagePng() ?? FALLBACK_OG_PNG;

// Human-readable descriptions for the HTML tier table that are more concise
// than TIER_SUMMARY (which comes from TIER_BAZAAR_META and is machine-facing).
const TIER_HTML_LABEL: Record<TierKey, string> = {
  security: 'TLS certificate, security headers (HSTS, CSP, X-Frame, etc.), SPF, DMARC',
  trust: 'HTTPS enforcement, domain age (WHOIS/RDAP), MX records',
  web: 'Pricing page, documentation, blog, about, contact, careers, changelog',
  engineering:
    'GitHub repo presence, commit activity, contributors, release cadence, issue/PR health, star count',
  ai: 'All six categories + AI executive summary, insights, risk flags, and recommendations',
  compare: 'All six categories across 2-5 domains; ranked by overall score',
  quick: 'Security + trust combined with an AI summary',
  full: 'All six categories with full evidence, sources, and AI interpretation',
};

const TIER_CATEGORIES: Record<TierKey, string> = {
  security: 'security',
  trust: 'trust',
  web: 'product + growth',
  engineering: 'engineering',
  ai: 'all (security, trust, engineering, product, growth, website) + AI',
  compare: 'all (security, trust, engineering, product, growth, website)',
  quick: 'security + trust + AI',
  full: 'all (security, trust, engineering, product, growth, website) + AI',
};

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
    const tiers = Object.keys(TIER_PRICE_ATOMIC) as TierKey[];

    const tierRows = tiers
      .map(
        (tier) =>
          `<tr>
  <td><code>POST /v1/validate/${tier}</code></td>
  <td>${TIER_PRICE_USD[tier]}</td>
  <td>${TIER_CATEGORIES[tier]}</td>
  <td>${TIER_HTML_LABEL[tier]}</td>
</tr>`,
      )
      .join('\n');

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<meta name="description" content="${SERVICE_DESCRIPTION}" />
<meta name="theme-color" content="#381724" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="${SERVICE_NAME}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${SERVICE_DESCRIPTION}" />
<meta property="og:image" content="${origin}/og.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:type" content="image/png" />
<meta property="og:url" content="${origin}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${SERVICE_DESCRIPTION}" />
<meta name="twitter:image" content="${origin}/og.png" />
<link rel="canonical" href="${origin}" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
</head>
<body>
<h1>${SERVICE_NAME}</h1>
<p>${SERVICE_DESCRIPTION}</p>

<h2>What it does</h2>
<p>Submit a startup domain (e.g. <code>stripe.com</code>) to any validation endpoint. Validex
resolves the entity, runs the relevant validators in parallel, scores each signal category on a
0-100 scale, computes a weighted overall score and letter grade (A+ to F), and returns a
structured JSON report. AI-enabled tiers (ai, quick, full) additionally call an LLM to generate
an executive summary, risk flags, category narrative, and actionable suggestions.</p>
<p>The <code>compare</code> endpoint evaluates 2-5 domains in parallel and returns a ranked
leaderboard alongside individual reports for each target.</p>

<h2>Validator categories and weights</h2>
<ul>
  <li><strong>Trust</strong> (25%) - HTTPS, domain age, MX records</li>
  <li><strong>Security</strong> (25%) - TLS, security headers, SPF, DMARC</li>
  <li><strong>Engineering</strong> (20%) - GitHub repo health, activity, contributors, releases</li>
  <li><strong>Product</strong> (20%) - Documentation, pricing page, about, contact, changelog</li>
  <li><strong>Growth</strong> (10%) - Blog, careers page</li>
  <li><strong>Website</strong> (0%, reported) - Reachability, sitemap (informational only)</li>
</ul>

<h2>Scoring</h2>
<ul>
  <li>Overall score: 0-100 (weighted average across evaluated categories)</li>
  <li>Grade: A+ (&ge;90), A (&ge;80), B+ (&ge;70), B (&ge;60), C+ (&ge;50), C (&ge;40), D (&ge;30), F (&lt;30)</li>
  <li>Recommendation: <code>integrate</code> (&ge;70), <code>caution</code> (40-69), <code>avoid</code> (&lt;40)</li>
</ul>

<h2>Endpoints and pricing</h2>
<p>Every write endpoint below requires a payment via the
<a href="/.well-known/x402">x402 protocol</a> (Algorand, USDC). Read endpoints are free.</p>
<table>
<thead>
<tr><th>Endpoint</th><th>Price</th><th>Categories</th><th>What it checks</th></tr>
</thead>
<tbody>
${tierRows}
</tbody>
</table>

<h3>Read endpoints (free, no payment required)</h3>
<ul>
  <li><code>GET /v1/validate/:analysisId</code> - Retrieve a previously-run analysis by ID</li>
  <li><code>GET /v1/validate/compare/:comparisonId</code> - Retrieve a previously-run comparison by ID</li>
  <li><code>GET /v1/health</code> - API health status</li>
</ul>

<h2>Request format</h2>
<p>Single-target endpoints (all except compare):</p>
<pre><code>POST /v1/validate/&lt;tier&gt;
Content-Type: application/json
PAYMENT-SIGNATURE: &lt;x402-signature&gt;

{ "target": "stripe.com", "refresh": false }</code></pre>
<p>The <code>target</code> field accepts a bare domain or a full URL. <code>refresh</code> (optional, default false) bypasses the validator result cache.</p>
<p>Compare endpoint:</p>
<pre><code>POST /v1/validate/compare
Content-Type: application/json
PAYMENT-SIGNATURE: &lt;x402-signature&gt;

{ "targets": ["stripe.com", "github.com"], "refresh": false }</code></pre>
<p><code>targets</code> accepts 2-5 domain strings.</p>

<h2>Payment flow (x402, Algorand USDC)</h2>
<ol>
  <li>Call any paid endpoint with no <code>PAYMENT-SIGNATURE</code> header.</li>
  <li>Receive <code>402 Payment Required</code> with a <code>PAYMENT-REQUIRED</code> response header and a JSON body describing the price, asset, network, and <code>payTo</code> address.</li>
  <li>Sign a payment against those requirements using an x402-compatible library (e.g. <code>@x402/axios</code>).</li>
  <li>Retry the same request with the signature on the <code>PAYMENT-SIGNATURE</code> header.</li>
  <li>On success, the response body is the analysis report. A <code>PAYMENT-RESPONSE</code> header confirms settlement.</li>
</ol>
<p>Unconditional pricing (no round trip): <a href="/.well-known/x402">/.well-known/x402</a></p>

<h2>Discovery resources</h2>
<ul>
  <li><a href="/.well-known/x402">/.well-known/x402</a> - Machine-readable x402 pricing manifest</li>
  <li><a href="/.well-known/agent-card.json">/.well-known/agent-card.json</a> - A2A Agent Card</li>
  <li><a href="/.well-known/agent.json">/.well-known/agent.json</a> - Generic agent manifest</li>
  <li><a href="/.well-known/ai-plugin.json">/.well-known/ai-plugin.json</a> - Plugin manifest</li>
  <li><a href="/.well-known/mcp.json">/.well-known/mcp.json</a> - MCP tool manifest</li>
  <li><a href="/openapi.json">/openapi.json</a> - OpenAPI 3.0 specification</li>
  <li><a href="/llms.txt">/llms.txt</a> - LLM-oriented operating instructions</li>
  <li><a href="/agents.md">/agents.md</a> - Agent operating instructions (Markdown)</li>
  <li><a href="/v1/health">/v1/health</a> - API health status</li>
</ul>
</body>
</html>`;
  }

  @Get('llms.txt')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  getLlmsTxt(@Req() request: FastifyRequest): string {
    const origin = originOf(request);
    const tiers = Object.keys(TIER_PRICE_ATOMIC) as TierKey[];

    return [
      `# ${SERVICE_NAME}`,
      '',
      SERVICE_DESCRIPTION,
      '',
      '## What it does',
      '',
      'Submit a startup or company domain to any validation endpoint. Validex resolves the domain, runs the relevant validators in parallel, scores each signal category on a 0-100 scale, and returns a structured JSON report. AI-enabled tiers (ai, quick, full) additionally call an LLM to generate an executive summary, risk flags, insights, suggestions, and category narrative.',
      '',
      'The compare endpoint evaluates 2-5 domains in parallel and returns a ranked leaderboard.',
      '',
      '## Payment',
      '',
      `Every write endpoint below is paid per call via the x402 protocol (Algorand, USDC). Read endpoints (GET /:analysisId, GET /compare/:comparisonId, GET /health) are free.`,
      '',
      'Payment flow:',
      '1. Call an endpoint with no PAYMENT-SIGNATURE header.',
      '2. Receive 402 with a PAYMENT-REQUIRED header and JSON body describing the price, asset, network, and payTo address.',
      '3. Sign a payment against those requirements and retry with the signature on the PAYMENT-SIGNATURE header.',
      '4. On success the response is the analysis report. PAYMENT-RESPONSE header confirms settlement.',
      '',
      `Unconditional pricing (no round trip needed): ${origin}/.well-known/x402`,
      '',
      '## Endpoints',
      '',
      ...tiers.flatMap((tier) => [
        `### POST ${origin}/v1/validate/${tier} - ${TIER_PRICE_USD[tier]}`,
        '',
        TIER_SUMMARY[tier],
        '',
        tier === 'compare'
          ? 'Request body: { "targets": ["example.com", "other.com"] } (2-5 domains, required)'
          : 'Request body: { "target": "example.com" } (bare domain or full URL, required)',
        'Optional field: "refresh": true to bypass the validator result cache.',
        '',
      ]),
      '## Read endpoints (free)',
      '',
      `### GET ${origin}/v1/validate/:analysisId`,
      'Retrieve a previously-run analysis by its analysisId (returned in the POST response meta.analysisId).',
      'Returns the full AnalysisReport when status is completed or partial. Returns { analysisId, status } when still running. Returns { analysisId, status, error } when failed.',
      '',
      `### GET ${origin}/v1/validate/compare/:comparisonId`,
      'Retrieve a previously-run comparison by its comparisonId (returned in the POST compare response meta.comparisonId).',
      '',
      `### GET ${origin}/v1/health`,
      'Returns { status, network, facilitator, timestamp }.',
      '',
      '## Response shape (AnalysisReport)',
      '',
      'All paid single-target endpoints return this shape on success:',
      '',
      '```json',
      '{',
      '  "success": true,',
      '  "data": {',
      '    "meta": {',
      '      "analysisId": "val_<cuid2>",',
      '      "algorithmVersion": "1.0.0",',
      '      "generatedAt": "<ISO8601>",',
      '      "cached": false,',
      '      "tier": "full"',
      '    },',
      '    "company": {',
      '      "domain": "stripe.com",',
      '      "canonicalUrl": "https://stripe.com",',
      '      "companyName": null,',
      '      "githubRepo": "stripe/stripe-node"',
      '    },',
      '    "summary": {',
      '      "score": 84.2,',
      '      "grade": "A",',
      '      "confidence": 91.0,',
      '      "executiveSummary": "..."',
      '    },',
      '    "categories": {',
      '      "security": { "score": 90.0, "confidence": 95.0, "weight": 25.0, "weightRedistributed": false, "validatorsEvaluated": 4, "validatorsUnavailable": 0 },',
      '      "trust": { ... },',
      '      "engineering": { ... },',
      '      "product": { ... },',
      '      "growth": { ... },',
      '      "website": { "score": 100.0, "weight": 0, ... }',
      '    },',
      '    "verdict": {',
      '      "recommendation": "integrate",',
      '      "executiveSummary": "...",',
      '      "insights": ["..."],',
      '      "suggestions": ["..."],',
      '      "opportunities": ["..."],',
      '      "riskFlags": ["..."],',
      '      "categoryNarrative": { "security": "...", "trust": "..." }',
      '    },',
      '    "strengths": ["Valid TLS certificate with 320 days remaining."],',
      '    "weaknesses": ["No DMARC record found."],',
      '    "validators": [',
      '      {',
      '        "validatorId": "tls_certificate",',
      '        "name": "TLS Certificate",',
      '        "category": "security",',
      '        "status": "success",',
      '        "score": 10,',
      '        "maxScore": 10,',
      '        "weight": 8,',
      '        "confidence": 95,',
      '        "evidence": [{ "statement": "...", "source": "tls_certificate" }]',
      '      }',
      '    ],',
      '    "sources": [{ "name": "TLS Certificate", "url": "https://stripe.com" }]',
      '  }',
      '}',
      '```',
      '',
      'Note: "verdict" is only present for AI-enabled tiers (ai, quick, full).',
      '',
      '## Grades',
      '',
      'Score  | Grade',
      '-------|------',
      '90-100 | A+',
      '80-89  | A',
      '70-79  | B+',
      '60-69  | B',
      '50-59  | C+',
      '40-49  | C',
      '30-39  | D',
      '0-29   | F',
      '',
      '## Recommendation',
      '',
      'Derived deterministically from overall score. Never invented by the AI.',
      '',
      'Score    | Recommendation',
      '---------|---------------',
      '70-100   | integrate',
      '40-69    | caution',
      '0-39     | avoid',
      'null     | avoid',
      '',
      '## Validator status values',
      '',
      '- success: validator ran and produced a score',
      '- unavailable: data source was unreachable or inapplicable (score is null, does not fail the request)',
      '- error: validator itself failed unexpectedly (score is null, does not fail the request)',
      '',
      'A response with status "partial" means at least one validator returned "error". All other validators still ran.',
      '',
      '## Error codes',
      '',
      '- 402: Payment required or invalid. Check PAYMENT-REQUIRED header for requirements.',
      '- 422: Request body validation failed. Check the "message" array in the response.',
      '- 404: analysisId or comparisonId not found.',
      '- 500: Internal server error.',
      '',
      '## Caching',
      '',
      'Individual validator results are cached per domain (TTL varies by validator, typically 24h). Pass "refresh": true to force fresh data. The overall analysisId is never reused - each POST creates a new analysis record.',
      '',
      '## Other resources',
      '',
      `- ${origin}/.well-known/x402 - machine-readable pricing manifest`,
      `- ${origin}/.well-known/agent-card.json - A2A agent card`,
      `- ${origin}/.well-known/agent.json - generic agent manifest`,
      `- ${origin}/.well-known/ai-plugin.json - plugin manifest`,
      `- ${origin}/.well-known/mcp.json - MCP tool manifest`,
      `- ${origin}/openapi.json - OpenAPI 3.0 specification`,
      `- ${origin}/agents.md - agent operating instructions`,
    ].join('\n');
  }

  @Get('agents.md')
  @Header('Content-Type', 'text/markdown; charset=utf-8')
  getAgentsMd(@Req() request: FastifyRequest): string {
    const origin = originOf(request);
    const tiers = Object.keys(TIER_PRICE_ATOMIC) as TierKey[];

    return `# ${SERVICE_NAME} - agent operating instructions

${SERVICE_DESCRIPTION}

## What it does

Submit any startup or company domain to a validation endpoint. Validex resolves the entity, runs the relevant validators in parallel, scores each signal category on a 0-100 scale, and returns a structured JSON report with strengths, weaknesses, per-validator evidence, and (for AI-enabled tiers) an executive summary, risk flags, and recommendations.

Categories and weights:
- **Trust** (25%): HTTPS enforcement, domain age, MX records
- **Security** (25%): TLS certificate, security headers (HSTS, CSP, X-Frame-Options), SPF, DMARC
- **Engineering** (20%): GitHub repo health, commit activity, contributors, release cadence, issue/PR activity, stars
- **Product** (20%): Documentation, pricing page, about page, contact, changelog
- **Growth** (10%): Blog, careers page
- **Website** (0%, informational): Reachability, sitemap

## Payment flow (x402, Algorand USDC)

1. Call any paid endpoint with no payment. You receive \`402 Payment Required\` with a \`PAYMENT-REQUIRED\` header (and a JSON body) describing the price, asset, and \`payTo\` address.
2. Sign a payment against those requirements using an x402-compatible library (e.g. \`@x402/axios\`) and retry with the signature on the \`PAYMENT-SIGNATURE\` header.
3. On success you receive the analysis report plus a \`PAYMENT-RESPONSE\` header confirming settlement.

Unconditional pricing (no round trip needed): [\`/.well-known/x402\`](${origin}/.well-known/x402)

## Paid endpoints

${tiers.map((tier) => `- \`POST ${origin}/v1/validate/${tier}\` (${TIER_PRICE_USD[tier]}) - ${TIER_SUMMARY[tier]}\n  Request: \`${TIER_BODY_HINT[tier]}\``).join('\n')}

Optional field on all endpoints: \`"refresh": true\` to bypass the validator result cache.

## Read endpoints (free, no payment)

- \`GET ${origin}/v1/validate/:analysisId\` - Retrieve a previously-run analysis
- \`GET ${origin}/v1/validate/compare/:comparisonId\` - Retrieve a previously-run comparison
- \`GET ${origin}/v1/health\` - API health status

## Polling workflow

Every successful POST returns \`meta.analysisId\`. You can retrieve the same result later without paying again:

\`\`\`
GET /v1/validate/<analysisId>
\`\`\`

Response when complete (\`status: "completed"\` or \`"partial"\`): full AnalysisReport.
Response when still running (\`status: "running"\` or \`"pending"\`): \`{ analysisId, status }\`.
Response when failed (\`status: "failed"\`): \`{ analysisId, status, error }\`.

Similarly, \`meta.comparisonId\` from a compare POST can be fetched via \`GET /v1/validate/compare/:comparisonId\`.

## Worked example

\`\`\`
# Step 1 - probe for payment requirements (no PAYMENT-SIGNATURE)
POST ${origin}/v1/validate/security
Content-Type: application/json
Body: { "target": "stripe.com" }

# Response: 402
# Headers: PAYMENT-REQUIRED: <base64-encoded requirements>
# Body: { "x402Version": 2, "requirements": [...], ... }

# Step 2 - sign and retry
POST ${origin}/v1/validate/security
Content-Type: application/json
PAYMENT-SIGNATURE: <signed-payment>
Body: { "target": "stripe.com" }

# Response: 200
# Headers: PAYMENT-RESPONSE: <settlement-confirmation>
# Body:
{
  "success": true,
  "data": {
    "meta": { "analysisId": "val_abc123", "tier": "security", ... },
    "company": { "domain": "stripe.com", "canonicalUrl": "https://stripe.com", ... },
    "summary": { "score": 92.5, "grade": "A+", "confidence": 94.0 },
    "categories": {
      "security": { "score": 92.5, "confidence": 94.0, "weight": 25, ... }
    },
    "strengths": ["Valid TLS certificate with 340 days remaining.", "HSTS header present."],
    "weaknesses": [],
    "validators": [ ... ],
    "sources": [ ... ]
  }
}

# Step 3 - retrieve the same result later for free
GET ${origin}/v1/validate/val_abc123
\`\`\`

## Grades and recommendations

Score   | Grade | Recommendation
--------|-------|---------------
90-100  | A+    | integrate
80-89   | A     | integrate
70-79   | B+    | integrate
60-69   | B     | caution
50-59   | C+    | caution
40-49   | C     | caution
30-39   | D     | avoid
0-29    | F     | avoid

## Notes

- Network and USDC asset ID are declared per-deployment in \`/.well-known/x402\` (\`network\`/\`asset\` fields) - do not hardcode testnet/mainnet assumptions.
- The facilitator co-signs as fee payer, so you only need USDC (opted in) - no ALGO required for fees.
- Validator status can be \`success\`, \`unavailable\` (data source unreachable), or \`error\` (validator failed). Both \`unavailable\` and \`error\` produce a null score for that validator but do not fail the request.
- Analysis status \`partial\` means at least one validator errored; all others still ran and scored.
- The \`website\` category has a weight of 0 and does not contribute to the overall score; it is informational only.
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

  // Hand-authored OpenAPI 3.0 spec covering the paid endpoints, the two free
  // read endpoints, and the health check. Richer than the previous stub:
  // includes the optional refresh field, a reusable AnalysisReport response
  // component, error schemas, and x-x402-payment extensions on paid ops.
  // @nestjs/swagger is intentionally not used - see code comment in
  // WellKnownController.
  @Get('openapi.json')
  getOpenApi(@Req() request: FastifyRequest) {
    const origin = originOf(request);
    const tiers = Object.keys(TIER_PRICE_ATOMIC) as TierKey[];

    // Reusable JSON Schema fragments shared across multiple operations.
    const components = {
      schemas: {
        TargetRequest: {
          type: 'object',
          required: ['target'],
          properties: {
            target: {
              type: 'string',
              description:
                'Bare domain or full URL of the startup to validate (e.g. "stripe.com" or "https://stripe.com"). Normalized during entity resolution.',
              example: 'stripe.com',
            },
            refresh: {
              type: 'boolean',
              default: false,
              description:
                'When true, bypasses the per-validator result cache and forces fresh data collection.',
            },
          },
        },
        CompareRequest: {
          type: 'object',
          required: ['targets'],
          properties: {
            targets: {
              type: 'array',
              items: { type: 'string' },
              minItems: 2,
              maxItems: 5,
              description: 'Array of 2-5 bare domains or full URLs to compare.',
              example: ['stripe.com', 'github.com'],
            },
            refresh: {
              type: 'boolean',
              default: false,
              description: 'When true, bypasses the per-validator result cache for all targets.',
            },
          },
        },
        CategoryScore: {
          type: 'object',
          properties: {
            score: {
              type: 'number',
              nullable: true,
              description: 'Category score 0-100, or null if no validators in this category produced a score.',
            },
            confidence: {
              type: 'number',
              description: 'Average confidence (0-100) across evaluated validators in this category.',
            },
            weight: {
              type: 'number',
              description: 'Effective weight used in the overall score calculation, after redistribution for null categories.',
            },
            weightRedistributed: {
              type: 'boolean',
              description: 'True when this category received redistributed weight from null-scoring categories.',
            },
            validatorsEvaluated: {
              type: 'integer',
              description: 'Total number of validators run in this category.',
            },
            validatorsUnavailable: {
              type: 'integer',
              description: 'Number of validators in this category that returned unavailable or error status.',
            },
          },
        },
        Evidence: {
          type: 'object',
          properties: {
            statement: { type: 'string', description: 'Human-readable factual statement.' },
            source: { type: 'string', description: 'validatorId that produced this evidence.' },
            url: { type: 'string', description: 'Optional URL the statement was sourced from.' },
          },
        },
        ValidatorResult: {
          type: 'object',
          properties: {
            validatorId: { type: 'string', description: 'Unique identifier for the validator.' },
            name: { type: 'string', description: 'Human-readable validator name.' },
            category: {
              type: 'string',
              enum: ['security', 'trust', 'engineering', 'product', 'growth', 'website'],
              description: 'Signal category this validator contributes to.',
            },
            status: {
              type: 'string',
              enum: ['success', 'unavailable', 'error'],
              description: 'success: produced a score. unavailable: data source unreachable. error: validator failed unexpectedly.',
            },
            score: {
              type: 'number',
              nullable: true,
              description: "Raw score on the validator's own scale (0 to maxScore). Null when status is unavailable or error.",
            },
            maxScore: { type: 'number', description: "Maximum possible raw score for this validator." },
            weight: { type: 'number', description: 'Relative weight within its category.' },
            confidence: { type: 'number', description: 'Confidence in this result (0-100).' },
            evidence: {
              type: 'array',
              items: { '$ref': '#/components/schemas/Evidence' },
              description: 'Supporting evidence statements.',
            },
          },
        },
        AnalysisVerdict: {
          type: 'object',
          description: 'AI-generated narrative. Only present for ai, quick, and full tiers.',
          properties: {
            recommendation: {
              type: 'string',
              enum: ['integrate', 'caution', 'avoid'],
              description: 'Deterministic recommendation derived from score. integrate >= 70, caution 40-69, avoid < 40.',
            },
            executiveSummary: { type: 'string', nullable: true, description: '3-5 sentence executive summary.' },
            insights: {
              type: 'array', items: { type: 'string' }, nullable: true,
              description: 'Analytical insights based on evaluation signals.',
            },
            suggestions: {
              type: 'array', items: { type: 'string' }, nullable: true,
              description: 'Actionable suggestions to address weaknesses.',
            },
            opportunities: {
              type: 'array', items: { type: 'string' }, nullable: true,
              description: 'Strategic growth opportunities.',
            },
            riskFlags: {
              type: 'array', items: { type: 'string' }, nullable: true,
              description: 'Short strings naming the most important risks.',
            },
            categoryNarrative: {
              type: 'object',
              nullable: true,
              additionalProperties: { type: 'string' },
              description: 'Per-category narrative keyed by category name.',
            },
          },
        },
        AnalysisReport: {
          type: 'object',
          properties: {
            meta: {
              type: 'object',
              properties: {
                analysisId: { type: 'string', description: 'Unique analysis ID (val_<cuid2>). Use with GET /v1/validate/:analysisId to retrieve without paying again.' },
                algorithmVersion: { type: 'string', description: 'Version of the scoring algorithm used.' },
                generatedAt: { type: 'string', format: 'date-time' },
                cached: { type: 'boolean', description: 'True if the report was served from cache.' },
                tier: {
                  type: 'string',
                  enum: ['security', 'trust', 'web', 'engineering', 'ai', 'compare', 'quick', 'full'],
                },
              },
            },
            company: {
              type: 'object',
              properties: {
                domain: { type: 'string', description: 'Normalized domain (no www, lowercase).' },
                canonicalUrl: { type: 'string', description: 'Full canonical URL (https://domain.com).' },
                companyName: { type: 'string', nullable: true },
                githubRepo: { type: 'string', nullable: true, description: 'GitHub org/repo if detected.' },
              },
            },
            summary: {
              type: 'object',
              properties: {
                score: { type: 'number', nullable: true, description: 'Overall weighted score 0-100.' },
                grade: { type: 'string', description: 'Letter grade: A+ >= 90, A >= 80, B+ >= 70, B >= 60, C+ >= 50, C >= 40, D >= 30, F < 30.' },
                confidence: { type: 'number', description: 'Overall confidence 0-100.' },
                executiveSummary: { type: 'string', description: 'AI executive summary, when available.' },
              },
            },
            categories: {
              type: 'object',
              additionalProperties: { '$ref': '#/components/schemas/CategoryScore' },
              description: 'Per-category scores keyed by category name.',
            },
            verdict: { '$ref': '#/components/schemas/AnalysisVerdict' },
            strengths: { type: 'array', items: { type: 'string' }, description: 'Top positive evidence statements.' },
            weaknesses: { type: 'array', items: { type: 'string' }, description: 'Top negative evidence statements.' },
            validators: {
              type: 'array',
              items: { '$ref': '#/components/schemas/ValidatorResult' },
              description: 'Individual validator results.',
            },
            sources: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  url: { type: 'string' },
                },
              },
              description: 'Data sources consulted.',
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { '$ref': '#/components/schemas/AnalysisReport' },
          },
        },
        PendingResponse: {
          type: 'object',
          description: 'Returned by GET /:analysisId when the analysis is still running.',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                analysisId: { type: 'string' },
                status: { type: 'string', enum: ['pending', 'running'] },
              },
            },
          },
        },
        FailedResponse: {
          type: 'object',
          description: 'Returned by GET /:analysisId when the analysis failed.',
          properties: {
            success: { type: 'boolean', example: false },
            data: {
              type: 'object',
              properties: {
                analysisId: { type: 'string' },
                status: { type: 'string', enum: ['failed'] },
                error: { type: 'string' },
              },
            },
          },
        },
        PaymentRequiredError: {
          type: 'object',
          description: 'x402 payment required. Read the PAYMENT-REQUIRED response header for machine-readable requirements.',
          properties: {
            x402Version: { type: 'integer', example: 2 },
            requirements: { type: 'array', items: { type: 'object' } },
          },
        },
        ValidationError: {
          type: 'object',
          description: 'Request body validation failed.',
          properties: {
            statusCode: { type: 'integer', example: 422 },
            message: { type: 'array', items: { type: 'string' } },
            error: { type: 'string', example: 'Unprocessable Entity' },
          },
        },
      },
    };

    // Shared x402 payment extension applied to every paid operation.
    const x402Extension = {
      'x-x402-payment': {
        protocol: 'x402',
        version: 2,
        network: 'algorand',
        asset: 'USDC',
        pricingManifest: `${origin}/.well-known/x402`,
        flow: 'Call without PAYMENT-SIGNATURE header to receive 402 with PAYMENT-REQUIRED header. Sign and retry with PAYMENT-SIGNATURE.',
      },
    };

    // Paid POST endpoint definitions, one per tier.
    const paidPaths = Object.fromEntries(
      tiers.map((tier) => [
        `/v1/validate/${tier}`,
        {
          post: {
            operationId: `validate${tier[0].toUpperCase()}${tier.slice(1)}`,
            summary: TIER_SUMMARY[tier],
            description: `${TIER_SUMMARY[tier]} Price: ${TIER_PRICE_USD[tier]} per call via x402 (Algorand USDC).`,
            tags: [tier],
            ...x402Extension,
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema:
                    tier === 'compare'
                      ? { '$ref': '#/components/schemas/CompareRequest' }
                      : { '$ref': '#/components/schemas/TargetRequest' },
                },
              },
            },
            responses: {
              '200': {
                description: 'Analysis report.',
                content: {
                  'application/json': {
                    schema: { '$ref': '#/components/schemas/SuccessResponse' },
                  },
                },
              },
              '402': {
                description:
                  'Payment required. Read the PAYMENT-REQUIRED response header for machine-readable x402 requirements.',
                headers: {
                  'PAYMENT-REQUIRED': {
                    schema: { type: 'string' },
                    description: 'Base64-encoded x402 payment requirements.',
                  },
                },
                content: {
                  'application/json': {
                    schema: { '$ref': '#/components/schemas/PaymentRequiredError' },
                  },
                },
              },
              '422': {
                description: 'Request body validation failed.',
                content: {
                  'application/json': {
                    schema: { '$ref': '#/components/schemas/ValidationError' },
                  },
                },
              },
            },
          },
          // GET stub exists in the controller purely so Fastify can match it
          // for the Bazaar discovery crawler (see DISCOVERY_ROUTES in
          // x402.constants.ts and the preHandler hook in main.ts). Not
          // intended to return data - documented here so the OpenAPI consumer
          // understands the 402 response a crawler would receive.
          get: {
            operationId: `discover${tier[0].toUpperCase()}${tier.slice(1)}`,
            summary: `x402 Bazaar discovery probe for ${tier} endpoint`,
            description:
              'Exists for x402 Bazaar crawler compatibility only. Always returns 402. Use the POST method to run an analysis.',
            tags: ['discovery'],
            responses: {
              '402': {
                description: 'Payment required (x402 Bazaar discovery).',
                content: {
                  'application/json': {
                    schema: { '$ref': '#/components/schemas/PaymentRequiredError' },
                  },
                },
              },
            },
          },
        },
      ]),
    );

    // Free read endpoints.
    const readPaths = {
      '/v1/validate/{analysisId}': {
        get: {
          operationId: 'getAnalysis',
          summary: 'Retrieve a previously-run analysis',
          description:
            'Returns the full AnalysisReport when the analysis is completed or partial. Returns { analysisId, status } when still running or pending. Returns { analysisId, status, error } when failed. Free - no payment required.',
          tags: ['read'],
          parameters: [
            {
              name: 'analysisId',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'analysisId returned in meta.analysisId of a previous POST response.',
            },
          ],
          responses: {
            '200': {
              description: 'Analysis found.',
              content: {
                'application/json': {
                  schema: {
                    oneOf: [
                      { '$ref': '#/components/schemas/SuccessResponse' },
                      { '$ref': '#/components/schemas/PendingResponse' },
                      { '$ref': '#/components/schemas/FailedResponse' },
                    ],
                  },
                },
              },
            },
            '404': { description: 'Analysis not found.' },
          },
        },
      },
      '/v1/validate/compare/{comparisonId}': {
        get: {
          operationId: 'getComparison',
          summary: 'Retrieve a previously-run comparison',
          description:
            'Returns the comparison record including ranking and individual analysisIds. Free - no payment required.',
          tags: ['read'],
          parameters: [
            {
              name: 'comparisonId',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'comparisonId returned in meta.comparisonId of a previous POST compare response.',
            },
          ],
          responses: {
            '200': {
              description: 'Comparison found.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          comparisonId: { type: 'string' },
                          targets: { type: 'array', items: { type: 'string' } },
                          targetCount: { type: 'integer' },
                          ranking: { type: 'array', items: { type: 'object' } },
                          analysisIds: { type: 'array', items: { type: 'string' }, description: 'analysisIds for each ranked target, retrievable via GET /v1/validate/:analysisId.' },
                          createdAt: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                  },
                },
              },
            },
            '404': { description: 'Comparison not found.' },
          },
        },
      },
      '/v1/health': {
        get: {
          operationId: 'getHealth',
          summary: 'API health status',
          description: 'Returns current health status, active Algorand network, and facilitator URL.',
          tags: ['infrastructure'],
          responses: {
            '200': {
              description: 'API is healthy.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      network: { type: 'string', enum: ['testnet', 'mainnet'] },
                      facilitator: { type: 'string', format: 'uri' },
                      timestamp: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    return {
      openapi: '3.0.3',
      info: {
        title: SERVICE_NAME,
        description: SERVICE_DESCRIPTION,
        version: '1.0.0',
        contact: {
          url: origin,
        },
      },
      servers: [{ url: origin }],
      paths: { ...paidPaths, ...readPaths },
      components,
    };
  }
}
