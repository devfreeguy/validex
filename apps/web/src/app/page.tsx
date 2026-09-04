import { Nav } from '@/components/nav';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

const FEATURES = [
  {
    title: 'One API call',
    description:
      'Send a domain, get a complete report back. No crawling, no orchestration, no separate calls per data source.',
  },
  {
    title: 'Deterministic scoring',
    description:
      'Same input produces the same score. Weighted category breakdown across trust, security, engineering, product, and growth.',
  },
  {
    title: 'Evidence-backed',
    description:
      'Every score ships with the raw evidence behind it — real DNS records, TLS certs, GitHub activity, not a black box.',
  },
];

const CURL_EXAMPLE = `curl -X POST ${API_URL}/v1/validate/quick \\
  -H "Content-Type: application/json" \\
  -H "X-PAYMENT: <your-payment-token>" \\
  -d '{"target": "stripe.com"}'`;

export default function Home() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-6">
        {/* Hero */}
        <section className="py-24 text-center">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Startup health validation
            <br />
            for AI agents
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-neutral-400">
            A pay-per-call API that turns a domain into a deterministic,
            evidence-backed validation report — built for agents that need to
            check before they act.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <a
              href="#pricing"
              className="rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-medium text-neutral-950 transition hover:bg-emerald-300"
            >
              View pricing
            </a>
            <a
              href="/docs"
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-neutral-100 transition hover:border-white/30"
            >
              Read the docs
            </a>
          </div>
        </section>

        {/* Features */}
        <section className="grid gap-8 border-t border-white/10 py-16 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title}>
              <h2 className="text-sm font-medium text-emerald-400">
                {feature.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                {feature.description}
              </p>
            </div>
          ))}
        </section>

        {/* Pricing */}
        <section id="pricing" className="border-t border-white/10 py-16">
          <h2 className="text-center text-2xl font-semibold tracking-tight">
            Pricing
          </h2>
          <p className="mx-auto mt-2 max-w-md text-center text-sm text-neutral-400">
            Pay per request in USDC on Algorand. No subscriptions, no API
            keys.
          </p>
          <div className="mx-auto mt-10 grid max-w-2xl gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="text-sm font-medium text-neutral-400">
                Quick
              </div>
              <div className="mt-2 text-3xl font-semibold">
                $0.50
                <span className="text-base font-normal text-neutral-500">
                  {' '}
                  / call
                </span>
              </div>
              <p className="mt-3 text-sm text-neutral-400">
                Reachability, TLS, security headers, SPF/DMARC/MX, domain
                age, sitemap — 9 checks.
              </p>
              <code className="mt-4 block text-xs text-neutral-500">
                POST /v1/validate/quick
              </code>
            </div>
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.04] p-6">
              <div className="text-sm font-medium text-emerald-400">Full</div>
              <div className="mt-2 text-3xl font-semibold">
                $1.00
                <span className="text-base font-normal text-neutral-500">
                  {' '}
                  / call
                </span>
              </div>
              <p className="mt-3 text-sm text-neutral-400">
                Everything in Quick, plus GitHub engineering signals and
                website/product/growth surface checks — 27 checks.
              </p>
              <code className="mt-4 block text-xs text-neutral-500">
                POST /v1/validate/full
              </code>
            </div>
          </div>
        </section>

        {/* Code example */}
        <section className="border-t border-white/10 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">
            Try it
          </h2>
          <p className="mt-2 text-sm text-neutral-400">
            Every request is paid via the{' '}
            <code className="text-neutral-300">X-PAYMENT</code> header using
            the{' '}
            <a
              href="https://x402.org"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:underline"
            >
              x402
            </a>{' '}
            protocol. No account, no API key.
          </p>
          <pre className="mt-6 overflow-x-auto rounded-xl border border-white/10 bg-black p-5 text-sm text-neutral-300">
            <code>{CURL_EXAMPLE}</code>
          </pre>
          <p className="mt-4 text-sm text-neutral-500">
            AI agents can use{' '}
            <code className="text-neutral-300">@x402/axios</code> or{' '}
            <code className="text-neutral-300">@x402/fetch</code> to handle
            payment automatically.
          </p>
        </section>

        {/* Powered by */}
        <section className="border-t border-white/10 py-12 text-center">
          <p className="text-xs uppercase tracking-widest text-neutral-500">
            Powered by Algorand x402
          </p>
        </section>
      </main>
      <footer className="border-t border-white/10 py-8 text-center text-xs text-neutral-600">
        Validex — built for the Algorand x402 Global Challenge
      </footer>
    </>
  );
}
