import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
  title: 'Docs - Validex',
  description: 'API reference for the Validex startup validation API.',
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black p-5 text-sm text-neutral-300">
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
    <section className="border-t border-white/10 py-10">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-md bg-emerald-400/10 px-2 py-1 font-mono text-xs font-medium text-emerald-400">
          {method}
        </span>
        <code className="text-base text-neutral-100">{path}</code>
        {paid ? (
          <span className="rounded-full border border-amber-400/30 px-2 py-0.5 text-xs text-amber-400">
            requires payment
          </span>
        ) : (
          <span className="rounded-full border border-white/15 px-2 py-0.5 text-xs text-neutral-500">
            free
          </span>
        )}
      </div>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-neutral-400">
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
          <tr className="border-b border-white/10 text-left text-neutral-500">
            <th className="py-2 pr-4 font-medium">Endpoint</th>
            <th className="py-2 pr-4 font-medium">Price</th>
            <th className="py-2 font-medium">AI verdict</th>
          </tr>
        </thead>
        <tbody className="text-neutral-300">
          {PRICE_ROWS.map((row) => (
            <tr key={row.path} className="border-b border-white/5">
              <td className="py-2 pr-4">
                <code className="text-neutral-100">{row.path}</code>
              </td>
              <td className="py-2 pr-4">{row.price}</td>
              <td className="py-2 text-neutral-500">
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

// The docs page keeps its original (pre-redesign) visual system for now -
// only the main page has been rebuilt on shadcn/ui. Scoping it with `dark`
// lets it keep rendering on the dark background via the new design
// tokens' dark palette instead of clashing with the new light default body,
// while the header stays visually consistent with the rest of the app.
export default function DocsPage() {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">
          API reference
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-400">
          Eight paid endpoints - four category checks, three AI bundles, and
          compare - plus two free GET endpoints. Paid endpoints are gated by{' '}
          <a
            href="https://x402.org"
            target="_blank"
            rel="noreferrer"
            className="text-emerald-400 hover:underline"
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
            <code className="text-neutral-300">verdict</code> object (
            <code className="text-neutral-300">recommendation</code>,{' '}
            <code className="text-neutral-300">executiveSummary</code>,{' '}
            <code className="text-neutral-300">insights</code>,{' '}
            <code className="text-neutral-300">suggestions</code>,{' '}
            <code className="text-neutral-300">opportunities</code>,{' '}
            <code className="text-neutral-300">riskFlags</code>,{' '}
            <code className="text-neutral-300">categoryNarrative</code>)
            appears before <code className="text-neutral-300">summary</code>{' '}
            in the response. See{' '}
            <a href="#ai-forward-shape" className="text-emerald-400 hover:underline">
              response shape
            </a>{' '}
            below.
          </p>
          <CodeBlock>{AI_REQUEST}</CodeBlock>
        </Endpoint>

        <Endpoint method="POST" path="/v1/validate/compare" paid>
          <p>
            Runs the full pipeline against 2-5{' '}
            <code className="text-neutral-300">targets</code> in parallel, no
            AI, and returns them ranked by overall score. One failing target
            never fails the others - it&apos;s reported under{' '}
            <code className="text-neutral-300">failed</code> instead.
            Persists a <code className="text-neutral-300">Comparison</code>{' '}
            row you can retrieve later by id.
          </p>
          <CodeBlock>{COMPARE_REQUEST}</CodeBlock>
        </Endpoint>

        <Endpoint method="POST" path="/v1/validate/quick" paid>
          <p>
            Security and trust checks with AI analysis - includes a light
            crawl of the privacy policy, terms, and contact pages (see{' '}
            <code className="text-neutral-300">trust</code> above), so it&apos;s
            not purely network-level. Scores-first response shape, with{' '}
            <code className="text-neutral-300">summary.executiveSummary</code>{' '}
            mirrored from <code className="text-neutral-300">verdict</code>{' '}
            for backward compatibility.
          </p>
          <CodeBlock>{QUICK_REQUEST}</CodeBlock>
        </Endpoint>

        <Endpoint method="POST" path="/v1/validate/full" paid>
          <p>
            Every category with AI analysis - the complete report. Same
            scores-first shape as <code className="text-neutral-300">quick</code>.
          </p>
          <CodeBlock>{FULL_REQUEST}</CodeBlock>
        </Endpoint>

        <Endpoint method="GET" path="/v1/validate/:analysisId" paid={false}>
          <p>
            Retrieves a previously generated report by the{' '}
            <code className="text-neutral-300">analysisId</code> any of the
            single-target endpoints above returns. No payment required.
          </p>
          <CodeBlock>{GET_REQUEST}</CodeBlock>
          <p>
            Returns <code className="text-neutral-300">200</code> with the
            stored report once <code className="text-neutral-300">completed</code>{' '}
            or <code className="text-neutral-300">partial</code>:
          </p>
          <CodeBlock>{PENDING_SHAPE}</CodeBlock>
          <p>
            or <code className="text-neutral-300">404</code> if the id
            doesn&apos;t exist:
          </p>
          <CodeBlock>{NOT_FOUND_SHAPE}</CodeBlock>
        </Endpoint>

        <Endpoint method="GET" path="/v1/validate/compare/:comparisonId" paid={false}>
          <p>
            Retrieves a previously generated comparison by the{' '}
            <code className="text-neutral-300">comparisonId</code> a{' '}
            <code className="text-neutral-300">compare</code> call returns.
            No payment required.
          </p>
          <CodeBlock>{GET_COMPARE_REQUEST}</CodeBlock>
          <CodeBlock>{GET_COMPARE_RESPONSE_SHAPE}</CodeBlock>
          <p>
            or <code className="text-neutral-300">404</code> if the id
            doesn&apos;t exist:
          </p>
          <CodeBlock>{COMPARISON_NOT_FOUND_SHAPE}</CodeBlock>
        </Endpoint>

        <section className="border-t border-white/10 py-10">
          <h2 className="text-xl font-semibold tracking-tight">
            Response shape
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-neutral-400">
            security, trust, web, engineering, quick, and full all share this
            shape. <code className="text-neutral-300">verdict</code> is only
            present on AI-enabled tiers (
            <code className="text-neutral-300">ai</code>,{' '}
            <code className="text-neutral-300">quick</code>,{' '}
            <code className="text-neutral-300">full</code>) - the others omit
            it entirely and make no call to the AI layer at all.{' '}
            <code className="text-neutral-300">recommendation</code> is
            always derived deterministically from the overall score (
            <code className="text-neutral-300">&gt;=70</code> integrate,{' '}
            <code className="text-neutral-300">40-69</code> caution,{' '}
            <code className="text-neutral-300">&lt;40</code> avoid) - the AI
            never invents or overrides it, only writes prose around it. If
            Groq is unavailable, the prose fields come back{' '}
            <code className="text-neutral-300">null</code> but{' '}
            <code className="text-neutral-300">recommendation</code> and the
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
          <p className="mt-3 text-sm leading-relaxed text-neutral-400">
            Same fields, reordered so <code className="text-neutral-300">verdict</code>{' '}
            comes before <code className="text-neutral-300">summary</code> -
            the AI content is the primary output, not an addendum.
          </p>
          <div className="mt-4">
            <CodeBlock>{AI_FORWARD_RESPONSE_SHAPE}</CodeBlock>
          </div>

          <h3 className="mt-8 text-base font-semibold tracking-tight">
            Compare shape
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-neutral-400">
            <code className="text-neutral-300">results</code> holds a full
            report per target (the same shape above, no{' '}
            <code className="text-neutral-300">verdict</code> - compare never
            runs AI), in ranked order.
          </p>
          <div className="mt-4">
            <CodeBlock>{COMPARE_RESPONSE_SHAPE}</CodeBlock>
          </div>
        </section>

        <section className="border-t border-white/10 py-10">
          <h2 className="text-xl font-semibold tracking-tight">
            Paying with x402
          </h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-neutral-400">
            <p>
              Every paid endpoint above is gated by the{' '}
              <a
                href="https://x402.org"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline"
              >
                x402
              </a>{' '}
              payment protocol. Call it without a{' '}
              <code className="text-neutral-300">PAYMENT-SIGNATURE</code>{' '}
              header and you get back{' '}
              <code className="text-neutral-300">402</code> with the exact
              payment requirements to satisfy, both in the JSON body and on a{' '}
              <code className="text-neutral-300">PAYMENT-REQUIRED</code>{' '}
              response header (what spec-compliant x402 clients actually read
              from). <code className="text-neutral-300">amount</code> matches
              that endpoint&apos;s price from the table above - this example
              shows <code className="text-neutral-300">security</code>&apos;s:
            </p>
            <CodeBlock>{PAYMENT_REQUIRED_SHAPE}</CodeBlock>
            <p>
              Sign and broadcast that payment, then retry the same request
              with the resulting token in{' '}
              <code className="text-neutral-300">PAYMENT-SIGNATURE</code>. AI
              agents don&apos;t need to do this by hand -{' '}
              <code className="text-neutral-300">@x402/axios</code> and{' '}
              <code className="text-neutral-300">@x402/fetch</code> intercept
              the 402, pay, and retry automatically.
            </p>
          </div>
        </section>

        <section className="border-t border-white/10 py-10">
          <h2 className="text-xl font-semibold tracking-tight">Discovery</h2>
          <p className="mt-3 text-sm leading-relaxed text-neutral-400">
            Every endpoint above is individually listed, with its own price
            and description, at{' '}
            <code className="text-neutral-300">/.well-known/x402</code> - the
            manifest x402 Bazaar crawlers read without making any request or
            payment. Agent-oriented docs are also available at{' '}
            <code className="text-neutral-300">/llms.txt</code> and{' '}
            <code className="text-neutral-300">/agents.md</code>.
          </p>
        </section>
      </main>
      <footer className="border-t border-white/10 py-8 text-center text-xs text-neutral-600">
        Validex - built for the Algorand x402 Global Challenge
      </footer>
    </div>
  );
}
