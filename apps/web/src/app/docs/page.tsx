import type { Metadata } from 'next';
import { Nav } from '@/components/nav';

export const metadata: Metadata = {
  title: 'Docs — Validex',
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

const QUICK_REQUEST = `curl -X POST ${API_URL}/v1/validate/quick \\
  -H "Content-Type: application/json" \\
  -H "X-PAYMENT: <your-payment-token>" \\
  -d '{"target": "stripe.com", "refresh": false}'`;

const FULL_REQUEST = `curl -X POST ${API_URL}/v1/validate/full \\
  -H "Content-Type: application/json" \\
  -H "X-PAYMENT: <your-payment-token>" \\
  -d '{"target": "stripe.com"}'`;

const GET_REQUEST = `curl ${API_URL}/v1/validate/val_thpqccyhgviwf52o4o7g1eld`;

const RESPONSE_SHAPE = `{
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
      "executiveSummary": "..."
    },
    "categories": {
      "trust": { "score": 100, "confidence": 97.3, "validatorsEvaluated": 3,
                 "validatorsUnavailable": 0, "weight": 25 }
      // ... security, engineering, product, growth, website
    },
    "strengths": ["..."],
    "weaknesses": ["..."],
    "validators": [ /* ValidationResult[] */ ],
    "sources": [{ "name": "...", "url": "..." }]
  }
}`;

const PENDING_SHAPE = `{ "success": true, "data": { "analysisId": "val_...", "status": "running" } }`;
const NOT_FOUND_SHAPE = `{ "success": false, "error": "Analysis not found." }`;

const PAYMENT_REQUIRED_SHAPE = `{
  "x402Version": 2,
  "error": "Payment required",
  "accepts": [{
    "scheme": "exact",
    "network": "algorand:...",
    "amount": "500000",
    "asset": 10458941,
    "payTo": "...",
    "maxTimeoutSeconds": 300,
    "extra": { "decimals": 6 }
  }],
  "extensions": { "bazaar": { /* Bazaar discovery metadata */ } }
}`;

export default function DocsPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">
          API reference
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-400">
          Three endpoints. Two are paid via{' '}
          <a
            href="https://x402.org"
            target="_blank"
            rel="noreferrer"
            className="text-emerald-400 hover:underline"
          >
            x402
          </a>
          , one is free.
        </p>

        <Endpoint method="POST" path="/v1/validate/quick" paid>
          <p>
            Runs the 9 quick-tier checks (reachability, TLS, security
            headers, SPF/DMARC/MX, domain age, sitemap) against{' '}
            <code className="text-neutral-300">target</code> and returns a
            complete report. Costs <strong>$0.50</strong>.
          </p>
          <CodeBlock>{QUICK_REQUEST}</CodeBlock>
        </Endpoint>

        <Endpoint method="POST" path="/v1/validate/full" paid>
          <p>
            Runs every quick-tier check plus the full-tier website/product/
            growth checks and, when a GitHub repository is discoverable, 8
            engineering checks against it. Costs <strong>$1.00</strong>.
          </p>
          <CodeBlock>{FULL_REQUEST}</CodeBlock>
        </Endpoint>

        <Endpoint method="GET" path="/v1/validate/:analysisId" paid={false}>
          <p>
            Retrieves a previously generated report by the{' '}
            <code className="text-neutral-300">analysisId</code> returned
            from a quick/full call. No payment required.
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

        <section className="border-t border-white/10 py-10">
          <h2 className="text-xl font-semibold tracking-tight">
            Response shape
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-neutral-400">
            Both validate endpoints and the GET endpoint (once complete)
            return the same report shape:
          </p>
          <div className="mt-4">
            <CodeBlock>{RESPONSE_SHAPE}</CodeBlock>
          </div>
        </section>

        <section className="border-t border-white/10 py-10">
          <h2 className="text-xl font-semibold tracking-tight">
            Paying with x402
          </h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-neutral-400">
            <p>
              <code className="text-neutral-300">/quick</code> and{' '}
              <code className="text-neutral-300">/full</code> are gated by
              the{' '}
              <a
                href="https://x402.org"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline"
              >
                x402
              </a>{' '}
              payment protocol, settled in USDC on Algorand. Call the
              endpoint without an{' '}
              <code className="text-neutral-300">X-PAYMENT</code> header and
              you get back <code className="text-neutral-300">402</code> with
              the exact payment requirements to satisfy:
            </p>
            <CodeBlock>{PAYMENT_REQUIRED_SHAPE}</CodeBlock>
            <p>
              Sign and broadcast that payment, then retry the same request
              with the resulting token in{' '}
              <code className="text-neutral-300">X-PAYMENT</code>. AI agents
              don&apos;t need to do this by hand —{' '}
              <code className="text-neutral-300">@x402/axios</code> and{' '}
              <code className="text-neutral-300">@x402/fetch</code> intercept
              the 402, pay, and retry automatically.
            </p>
          </div>
        </section>
      </main>
      <footer className="border-t border-white/10 py-8 text-center text-xs text-neutral-600">
        Validex — built for the Algorand x402 Global Challenge
      </footer>
    </>
  );
}
