import { Bot, Coins, FileText, Target } from 'lucide-react';

export const DIFFERENTIATORS = [
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

export function DifferentiatorsSection() {
  return (
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
  );
}
