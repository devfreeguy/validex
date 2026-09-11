import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

export const metadata: Metadata = {
  title: 'Docs - Validex',
  description: 'API reference for the Validex startup validation API.',
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-border bg-secondary p-4 text-xs font-mono leading-relaxed text-foreground sm:p-5 sm:text-sm">
      <code>{children}</code>
    </pre>
  );
}

function Endpoint({
  method,
  path,
  paid,
  children,
}: {
  method: string;
  path: string;
  paid: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border py-10">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-md bg-emerald-500/10 px-2 py-1 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          {method}
        </span>
        <code className="text-base font-semibold text-foreground">{path}</code>
        {paid ? (
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            requires payment
          </span>
        ) : (
          <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
            free
          </span>
        )}
      </div>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

interface PriceRow {
  path: string;
  price: string;
  ai: boolean;
}

const PRICE_ROWS: PriceRow[] = [
  { path: '/v1/validate/security', price: '$0.05', ai: false },
  { path: '/v1/validate/trust', price: '$0.05', ai: false },
  { path: '/v1/validate/web', price: '$0.06', ai: false },
  { path: '/v1/validate/engineering', price: '$0.08', ai: false },
  { path: '/v1/validate/ai', price: '$0.15', ai: true },
  { path: '/v1/validate/compare', price: '$0.15', ai: false },
  { path: '/v1/validate/quick', price: '$0.20', ai: true },
  { path: '/v1/validate/full', price: '$0.35', ai: true },
];

function PricingTable() {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[28rem] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="py-2.5 pr-4 font-semibold">Endpoint</th>
            <th className="py-2.5 pr-4 font-semibold">Price</th>
            <th className="py-2.5 font-semibold">AI verdict</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60 text-foreground">
          {PRICE_ROWS.map((row) => (
            <tr key={row.path}>
              <td className="py-2.5 pr-4">
                <code className="font-mono text-sm text-foreground">{row.path}</code>
              </td>
              <td className="py-2.5 pr-4 font-medium">{row.price}</td>
              <td className="py-2.5 text-muted-foreground">
                {row.ai ? 'yes' : 'no'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function makeRequest(path: string, body: string) {
  return `curl -X POST ${API_URL}${path} \\
  -H "Content-Type: application/json" \\
  -H "PAYMENT-SIGNATURE: <your-payment-token>" \\
  -d '${body}'`;
}

const SECURITY_REQUEST = makeRequest(
  '/v1/validate/security',
  '{"target": "stripe.com"}',
);
const TRUST_REQUEST = makeRequest(
  '/v1/validate/trust',
  '{"target": "stripe.com"}',
);
const WEB_REQUEST = makeRequest('/v1/validate/web', '{"target": "stripe.com"}');
const ENGINEERING_REQUEST = makeRequest(
  '/v1/validate/engineering',
  '{"target": "stripe.com"}',
);
const AI_REQUEST = makeRequest('/v1/validate/ai', '{"target": "stripe.com"}');
const COMPARE_REQUEST = makeRequest(
  '/v1/validate/compare',
  '{"targets": ["stripe.com", "github.com"]}',
);
const QUICK_REQUEST = makeRequest(
  '/v1/validate/quick',
  '{"target": "stripe.com", "refresh": false}',
);
const FULL_REQUEST = makeRequest('/v1/validate/full', '{"target": "stripe.com"}');

const GET_REQUEST = `curl ${API_URL}/v1/validate/val_thpqccyhgviwf52o4o7g1eld`;
const GET_COMPARE_REQUEST = `curl ${API_URL}/v1/validate/compare/cmp_thpqccyhgviwf52o4o7g1eld`;

const STANDARD_RESPONSE_SHAPE = `{
  "success": true,
  "data": {
    "meta": {
      "analysisId": "val_...",
      "algorithmVersion": "1.0.0",
      "generatedAt": "2026-09-04T01:25:05.230Z",
      "cached": false,
      "tier": "quick"
    },
    "company": {
      "domain": "stripe.com",
      "canonicalUrl": "https://stripe.com",
      "companyName": "Stripe",
      "githubRepo": null
    },
    "summary": {
      "score": 96.9,
      "grade": "A+",
      "confidence": 96.9,
      "executiveSummary": "..."   // AI endpoints only
    },
    "categories": {
      "trust": { "score": 100, "confidence": 97.3, "validatorsEvaluated": 3,
                 "validatorsUnavailable": 0, "weight": 25 }
      // ... security, engineering, product, growth, website
    },
    "strengths": ["..."],
    "weaknesses": ["..."],
    "validators": [ /* ValidationResult[] */ ],
    "sources": [{ "name": "...", "url": "..." }],
    "verdict": {                 // present on ai/quick/full only
      "recommendation": "integrate", // deterministic: score-derived, never AI-invented
      "executiveSummary": "...",     // null if Groq unavailable
      "insights": ["..."],           // null if Groq unavailable
      "suggestions": ["..."],        // null if Groq unavailable
      "opportunities": ["..."],      // null if Groq unavailable
      "riskFlags": ["..."],          // null if Groq unavailable
      "categoryNarrative": { "security": "...", "trust": "..." } // null if Groq unavailable
    }
  }
}`;

const AI_FORWARD_RESPONSE_SHAPE = `{
  "success": true,
  "data": {
    "meta": { "analysisId": "val_...", "tier": "ai", /* ... */ },
    "company": { "domain": "stripe.com", /* ... */ },
    "verdict": {
      "recommendation": "integrate",
      "executiveSummary": "...",
      "insights": ["..."],
      "suggestions": ["..."],
      "opportunities": ["..."],
      "riskFlags": ["..."],
      "categoryNarrative": { "security": "...", "trust": "...", /* ... */ }
    },
    "summary": { "score": 96.9, "grade": "A+", "confidence": 96.9 },
    "categories": { /* ... */ },
    "validators": [ /* ValidationResult[] */ ],
    "strengths": ["..."],
    "weaknesses": ["..."],
    "sources": [ /* ... */ ]
  }
}`;

const COMPARE_RESPONSE_SHAPE = `{
  "success": true,
  "data": {
    "meta": { "comparisonId": "cmp_...", "generatedAt": "...", "targetCount": 2 },
    "ranking": [
      { "rank": 1, "domain": "stripe.com", "score": 96.9, "grade": "A+",
        "confidence": 96.1, "analysisId": "val_..." },
      { "rank": 2, "domain": "github.com", "score": 91.2, "grade": "A",
        "confidence": 94.0, "analysisId": "val_..." }
    ],
    "results": [ /* full report per target, in ranked order - see above */ ],
    "failed": [ /* { "target": "...", "error": "..." } for any target whose
                    pipeline threw - never fails the whole call */ ]
  }
}`;

const GET_COMPARE_RESPONSE_SHAPE = `{
  "success": true,
  "data": {
    "comparisonId": "cmp_...",
    "targets": ["stripe.com", "github.com"],
    "targetCount": 2,
    "ranking": [ /* same ranking array as the POST response */ ],
    "analysisIds": ["val_...", "val_..."],
    "createdAt": "2026-09-09T19:27:15.000Z"
  }
}`;

const PENDING_SHAPE = `{ "success": true, "data": { "analysisId": "val_...", "status": "running" } }`;
const NOT_FOUND_SHAPE = `{ "success": false, "error": "Analysis not found." }`;
const COMPARISON_NOT_FOUND_SHAPE = `{ "success": false, "error": "Comparison not found." }`;

const PAYMENT_REQUIRED_SHAPE = `{
  "x402Version": 2,
  "error": "Payment required",
  "accepts": [{
    "scheme": "exact",
    "network": "algorand:...",
    "amount": "50000",
    "asset": "10458941",
    "payTo": "...",
    "maxTimeoutSeconds": 300,
    "extra": { "decimals": 6 }
  }],
  "extensions": {
    "bazaar": { /* Bazaar discovery metadata, per-endpoint */ },
    "x402-merchant": { /* merchant identity - name, website, logo */ }
  }
}`;

export default function DocsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          API reference
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Eight paid endpoints - four category checks, three AI bundles, and
          compare - plus two free GET endpoints. Paid endpoints are gated by{' '}
          <a
            href="https://x402.org"
            target="_blank"
            rel="noreferrer"
            className="text-primary underline-offset-4 hover:underline"
          >
            x402
          </a>
          , settled in USDC on Algorand. Every price is per call, not
          multiplied by targets or retries.
        </p>

        <PricingTable />

        <Endpoint method="POST" path="/v1/validate/security" paid>
          <p>
            TLS certificate, security headers, SPF, DMARC, MX. No AI, no
            crawl - just network/DNS checks.
          </p>
          <CodeBlock>{SECURITY_REQUEST}</CodeBlock>
        </Endpoint>

        <Endpoint method="POST" path="/v1/validate/trust" paid>
          <p>
            HTTPS, domain age, MX records, privacy policy, terms, contact
            page. No AI. The last three crawl the site itself, so this one
            is slower than a pure DNS/TLS check.
          </p>
          <CodeBlock>{TRUST_REQUEST}</CodeBlock>
        </Endpoint>

        <Endpoint method="POST" path="/v1/validate/web" paid>
          <p>
            Pricing, documentation, about, blog, careers, changelog. No AI.
          </p>
          <CodeBlock>{WEB_REQUEST}</CodeBlock>
        </Endpoint>

        <Endpoint method="POST" path="/v1/validate/engineering" paid>
          <p>
            GitHub activity, contributors, release cadence, issue and PR
            activity, repository age and popularity. No AI.
          </p>
          <CodeBlock>{ENGINEERING_REQUEST}</CodeBlock>
        </Endpoint>

        <Endpoint method="POST" path="/v1/validate/ai" paid>
          <p>
            Runs every category, then returns an AI-forward report: the{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">verdict</code> object (
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">recommendation</code>,{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">executiveSummary</code>,{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">insights</code>,{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">suggestions</code>,{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">opportunities</code>,{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">riskFlags</code>,{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">categoryNarrative</code>)
            appears before <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">summary</code>{' '}
            in the response. See{' '}
            <a href="#ai-forward-shape" className="text-primary underline-offset-4 hover:underline">
              response shape
            </a>{' '}
            below.
          </p>
          <CodeBlock>{AI_REQUEST}</CodeBlock>
        </Endpoint>

        <Endpoint method="POST" path="/v1/validate/compare" paid>
          <p>
            Runs the full pipeline against 2-5{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">targets</code> in parallel, no
            AI, and returns them ranked by overall score. One failing target
            never fails the others - it&apos;s reported under{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">failed</code> instead.
            Persists a <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">Comparison</code>{' '}
            row you can retrieve later by id.
          </p>
          <CodeBlock>{COMPARE_REQUEST}</CodeBlock>
        </Endpoint>

        <Endpoint method="POST" path="/v1/validate/quick" paid>
          <p>
            Security and trust checks with AI analysis - includes a light
            crawl of the privacy policy, terms, and contact pages (see{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">trust</code> above), so it&apos;s
            not purely network-level. Scores-first response shape, with{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">summary.executiveSummary</code>{' '}
            mirrored from <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">verdict</code>{' '}
            for backward compatibility.
          </p>
          <CodeBlock>{QUICK_REQUEST}</CodeBlock>
        </Endpoint>

        <Endpoint method="POST" path="/v1/validate/full" paid>
          <p>
            Every category with AI analysis - the complete report. Same
            scores-first shape as <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">quick</code>.
          </p>
          <CodeBlock>{FULL_REQUEST}</CodeBlock>
        </Endpoint>

        <Endpoint method="GET" path="/v1/validate/:analysisId" paid={false}>
          <p>
            Retrieves a previously generated report by the{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">analysisId</code> any of the
            single-target endpoints above returns. No payment required.
          </p>
          <CodeBlock>{GET_REQUEST}</CodeBlock>
          <p>
            Returns <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">200</code> with the
            stored report once <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">completed</code>{' '}
            or <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">partial</code>:
          </p>
          <CodeBlock>{PENDING_SHAPE}</CodeBlock>
          <p>
            or <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">404</code> if the id
            doesn&apos;t exist:
          </p>
          <CodeBlock>{NOT_FOUND_SHAPE}</CodeBlock>
        </Endpoint>

        <Endpoint method="GET" path="/v1/validate/compare/:comparisonId" paid={false}>
          <p>
            Retrieves a previously generated comparison by the{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">comparisonId</code> a{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">compare</code> call returns.
            No payment required.
          </p>
          <CodeBlock>{GET_COMPARE_REQUEST}</CodeBlock>
          <CodeBlock>{GET_COMPARE_RESPONSE_SHAPE}</CodeBlock>
          <p>
            or <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">404</code> if the id
            doesn&apos;t exist:
          </p>
          <CodeBlock>{COMPARISON_NOT_FOUND_SHAPE}</CodeBlock>
        </Endpoint>

        <section className="border-t border-border py-10">
          <h2 className="text-xl font-semibold tracking-tight">
            Response shape
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            security, trust, web, engineering, quick, and full all share this
            shape. <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">verdict</code> is only
            present on AI-enabled tiers (
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">ai</code>,{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">quick</code>,{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">full</code>) - the others omit
            it entirely and make no call to the AI layer at all.{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">recommendation</code> is
            always derived deterministically from the overall score (
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">&gt;=70</code> integrate,{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">40-69</code> caution,{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">&lt;40</code> avoid) - the AI
            never invents or overrides it, only writes prose around it. If
            Groq is unavailable, the prose fields come back{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">null</code> but{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">recommendation</code> and the
            full deterministic scores are still returned.
          </p>
          <div className="mt-4">
            <CodeBlock>{STANDARD_RESPONSE_SHAPE}</CodeBlock>
          </div>

          <h3
            id="ai-forward-shape"
            className="mt-8 text-base font-semibold tracking-tight"
          >
            AI-forward shape (ai endpoint only)
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Same fields, reordered so <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">verdict</code>{' '}
            comes before <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">summary</code> -
            the AI content is the primary output, not an addendum.
          </p>
          <div className="mt-4">
            <CodeBlock>{AI_FORWARD_RESPONSE_SHAPE}</CodeBlock>
          </div>

          <h3 className="mt-8 text-base font-semibold tracking-tight">
            Compare shape
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">results</code> holds a full
            report per target (the same shape above, no{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">verdict</code> - compare never
            runs AI), in ranked order.
          </p>
          <div className="mt-4">
            <CodeBlock>{COMPARE_RESPONSE_SHAPE}</CodeBlock>
          </div>
        </section>

        <section className="border-t border-border py-10">
          <h2 className="text-xl font-semibold tracking-tight">
            Paying with x402
          </h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Every paid endpoint above is gated by the{' '}
              <a
                href="https://x402.org"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                x402
              </a>{' '}
              payment protocol. Call it without a{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">PAYMENT-SIGNATURE</code>{' '}
              header and you get back{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">402</code> with the exact
              payment requirements to satisfy, both in the JSON body and on a{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">PAYMENT-REQUIRED</code>{' '}
              response header (what spec-compliant x402 clients actually read
              from). <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">amount</code> matches
              that endpoint&apos;s price from the table above - this example
              shows <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">security</code>&apos;s:
            </p>
            <CodeBlock>{PAYMENT_REQUIRED_SHAPE}</CodeBlock>
            <p>
              Sign and broadcast that payment, then retry the same request
              with the resulting token in{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">PAYMENT-SIGNATURE</code>. AI
              agents don&apos;t need to do this by hand -{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">@x402/axios</code> and{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">@x402/fetch</code> intercept
              the 402, pay, and retry automatically.
            </p>
          </div>
        </section>

        <section className="border-t border-border py-10">
          <h2 className="text-xl font-semibold tracking-tight">Discovery</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Every endpoint above is individually listed, with its own price
            and description, at{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">/.well-known/x402</code> - the
            manifest x402 Bazaar crawlers read without making any request or
            payment. Agent-oriented docs are also available at{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">/llms.txt</code> and{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">/agents.md</code>.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
