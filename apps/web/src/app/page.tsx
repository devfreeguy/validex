import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  Code2,
  Coins,
  FileText,
  Globe2,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Validex - Startup health validation for AI agents',
  description:
    'Pay-per-call startup validation API. Deterministic, evidence-backed reports on security, trust, engineering, and product signals. Settled on Algorand via x402.',
};

const API_URL = 'https://api.validex.dev';

const CATEGORY_CHECKS = [
  {
    name: 'Security',
    price: '$0.05',
    description: 'TLS, security headers, SPF, DMARC, MX',
    icon: ShieldCheck,
  },
  {
    name: 'Trust',
    price: '$0.05',
    description: 'HTTPS, domain age, privacy policy, terms, contact, about',
    icon: FileText,
  },
  {
    name: 'Web Presence',
    price: '$0.06',
    description: 'pricing, documentation, blog, careers, changelog',
    icon: Globe2,
  },
  {
    name: 'Engineering',
    price: '$0.08',
    description:
      'GitHub activity, contributors, release cadence, issues, PRs, vulnerabilities',
    icon: Code2,
  },
  {
    name: 'AI Analysis',
    price: '$0.15',
    description:
      'full company analysis with an AI verdict: recommendation, risk flags, and category narrative',
    icon: Sparkles,
  },
];

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Send a request',
    body: 'POST a domain (or 2-5 domains to compare) to the check you need. Pay via x402 in USDC on Algorand - no signup, no API key.',
  },
  {
    step: '2',
    title: 'We run the checks',
    body: 'Deterministic validators query live signals - DNS, TLS, GitHub, and the site itself - for exactly the categories your call covers.',
  },
  {
    step: '3',
    title: 'Get a scored report',
    body: 'A grade, a confidence level, and the evidence behind it, plus strengths and weaknesses. On AI endpoints, a plain-English recommendation: integrate, caution, or avoid.',
  },
];

const ATOMIC_CHECKS = [
  { name: 'Security', price: '$0.05' },
  { name: 'Trust', price: '$0.05' },
  { name: 'Web Presence', price: '$0.06' },
  { name: 'Engineering', price: '$0.08' },
  {
    name: 'Compare',
    price: '$0.15',
    description: 'rank 2 to 5 companies against each other in a single call',
  },
];

const BUNDLES = [
  {
    name: 'Quick',
    price: '$0.20',
    description:
      'security and trust checks with AI analysis. Fast, network-level, no crawl.',
  },
  {
    name: 'Full',
    price: '$0.35',
    description:
      'every category with AI analysis. The complete report. Highest tier.',
    flagship: true,
  },
  {
    name: 'AI Analysis',
    price: '$0.15',
    description: 'full pipeline, AI-forward verdict as the primary output',
  },
];

const DIFFERENTIATORS = [
  {
    title: 'Deterministic scoring',
    icon: Target,
    body: 'Every score comes from rule-based validators, not model judgment. The same target run twice produces the same evidence and the same score.',
  },
  {
    title: 'Evidence-backed',
    icon: FileText,
    body: 'Every strength, weakness, and score ties back to a concrete signal - a DNS record, a TLS certificate, a GitHub API response - not a summary of a summary.',
  },
  {
    title: 'Agent-native',
    icon: Bot,
    body: 'Built to be called directly by AI agents via the x402 protocol - no API keys, no signup, no dashboard. Call one category for a few cents or bundle the full analysis. Pay only for the job you run.',
  },
  {
    title: 'On-chain settlement',
    icon: Coins,
    body: 'Payment settles in USDC on Algorand through a facilitator that co-signs as fee payer - callers only need USDC, no ALGO for gas.',
  },
];

const SECURITY_EXAMPLE = `curl -X POST ${API_URL}/v1/validate/security \\
  -H "Content-Type: application/json" \\
  -H "PAYMENT-SIGNATURE: <payment-token>" \\
  -d '{"target": "stripe.com"}'`;

const COMPARE_EXAMPLE = `curl -X POST ${API_URL}/v1/validate/compare \\
  -H "Content-Type: application/json" \\
  -H "PAYMENT-SIGNATURE: <payment-token>" \\
  -d '{"targets": ["stripe.com", "github.com"]}'`;

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-border bg-secondary p-5 text-xs leading-relaxed text-foreground sm:text-sm">
      <code>{children}</code>
    </pre>
  );
}

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Startup validation, callable by anyone or anything.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
            Deterministic, evidence-backed reports on security, trust,
            engineering, and product signals. Paid per call in USDC via x402.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/app">
                Run a check
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/docs">Read the docs</Link>
            </Button>
          </div>
        </section>

        <Separator />

        {/* What it measures */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            What it measures
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Run only the check you need, or bundle them.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {CATEGORY_CHECKS.map((check) => (
              <Card key={check.name}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <check.icon className="h-5 w-5 text-primary" />
                    <Badge variant="secondary">{check.price}</Badge>
                  </div>
                  <CardTitle className="pt-2 text-base">
                    {check.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{check.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        {/* How it works */}
        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            How it works
          </h2>

          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step}>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {item.step}
                </div>
                <h3 className="mt-4 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <Separator />

        {/* Pricing */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Pricing
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Every price is per API call, in USDC.
          </p>

          <h3 className="mt-10 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Atomic checks - run one job
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {ATOMIC_CHECKS.map((tier) => (
              <Card key={tier.name}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{tier.name}</CardTitle>
                    <Badge variant="secondary">{tier.price}</Badge>
                  </div>
                </CardHeader>
                {tier.description ? (
                  <CardContent>
                    <CardDescription>{tier.description}</CardDescription>
                  </CardContent>
                ) : null}
              </Card>
            ))}
          </div>

          <h3 className="mt-12 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Bundles - multiple jobs plus AI
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {BUNDLES.map((tier) => (
              <Card
                key={tier.name}
                className={cn(
                  tier.flagship &&
                    'border-primary/60 bg-primary/5 shadow-md ring-1 ring-primary/20',
                )}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{tier.name}</CardTitle>
                    <Badge variant={tier.flagship ? 'default' : 'secondary'}>
                      {tier.price}
                    </Badge>
                  </div>
                  {tier.flagship ? (
                    <Badge variant="outline" className="w-fit">
                      Highest tier
                    </Badge>
                  ) : null}
                </CardHeader>
                <CardContent>
                  <CardDescription>{tier.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        {/* Code example */}
        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Call it directly
          </h2>

          <div className="mt-8 space-y-6">
            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                Single category check
              </p>
              <CodeBlock>{SECURITY_EXAMPLE}</CodeBlock>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                Compare multiple companies
              </p>
              <CodeBlock>{COMPARE_EXAMPLE}</CodeBlock>
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            AI agents can automate payment with{' '}
            <code className="text-foreground">@x402/axios</code> or{' '}
            <code className="text-foreground">@x402/fetch</code>.
          </p>
        </section>

        <Separator />

        {/* Why Validex is different */}
        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Why Validex is different
          </h2>

          <div className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {DIFFERENTIATORS.map((item) => (
              <div key={item.title} className="flex gap-3">
                <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        v1
      </footer>
    </div>
  );
}
