import {
  Code2,
  FileText,
  Globe2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const CATEGORY_CHECKS = [
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

export function MeasuresSection() {
  return (
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
              <CardTitle className="pt-2 text-base">{check.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{check.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
