import Link from 'next/link';
import {
  Code2,
  FileText,
  GitCompare,
  Globe2,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Data                                                                */
/* ------------------------------------------------------------------ */

export const ATOMIC_CHECKS = [
  {
    name: 'Security',
    price: '$0.05',
    description: 'Basic security assessment check.',
    icon: ShieldCheck,
  },
  {
    name: 'Trust',
    price: '$0.05',
    description: 'Trust score evaluation.',
    icon: FileText,
  },
  {
    name: 'Web Presence',
    price: '$0.06',
    description: 'Analysis of online presence and footprint.',
    icon: Globe2,
  },
  {
    name: 'Engineering',
    price: '$0.08',
    description: 'Technical and engineering stack evaluation.',
    icon: Code2,
  },
  {
    name: 'Compare',
    price: '$0.15',
    description: 'Rank 2 to 5 companies against each other in a single call.',
    icon: GitCompare,
  },
] as const;

export const BUNDLES = [
  {
    name: 'Quick',
    price: '$0.20',
    description:
      'Security and trust checks with AI analysis. Fast, network-level, no crawl.',
    icon: Zap,
    flagship: false,
  },
  {
    name: 'Full',
    price: '$0.35',
    description:
      'Every category with AI analysis. The complete report. Highest tier.',
    icon: Sparkles,
    flagship: true,
  },
  {
    name: 'AI Analysis',
    price: '$0.15',
    description: 'Full pipeline, AI-forward verdict as the primary output.',
    icon: Sparkles,
    flagship: false,
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Sub-components                                                      */
/* ------------------------------------------------------------------ */

interface AtomicCardProps {
  name: string;
  price: string;
  description: string;
  icon: React.ElementType;
}

function AtomicCard({ name, price, description, icon: Icon }: AtomicCardProps) {
  return (
    <div className="group relative flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5">
      {/* Icon + Price row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-4.5 w-4.5 text-primary" />
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {price}
          </span>
          <p className="mt-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            USDC / call
          </p>
        </div>
      </div>

      {/* Name + description */}
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">{name}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>

      {/* CTA */}
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="w-full rounded-xl border border-border/60 text-xs text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
      >
        <Link href="/app">Run analysis →</Link>
      </Button>
    </div>
  );
}

interface BundleCardProps {
  name: string;
  price: string;
  description: string;
  icon: React.ElementType;
  flagship?: boolean;
}

function BundleCard({
  name,
  price,
  description,
  icon: Icon,
  flagship,
}: BundleCardProps) {
  return (
    <div
      className={cn(
        'group relative flex flex-col gap-5 rounded-2xl border p-6 transition-all duration-200',
        flagship
          ? 'border-primary/50 bg-linear-to-br from-primary/8 via-primary/4 to-transparent shadow-lg shadow-primary/10 ring-1 ring-primary/20'
          : 'border-border/70 bg-card hover:border-primary/40 hover:shadow-md hover:shadow-primary/5',
      )}
    >
      {/* Featured badge */}
      {flagship && (
        <div className="absolute -top-px left-1/2 -translate-x-1/2">
          <Badge className="rounded-b-full rounded-t-none border-0 bg-primary px-4 py-1 text-[10px] font-semibold tracking-widest text-primary-foreground uppercase shadow-md shadow-primary/30">
            Highest tier
          </Badge>
        </div>
      )}

      {/* Icon row */}
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-xl',
          flagship ? 'bg-primary/15' : 'bg-primary/10',
        )}
      >
        <Icon
          className={cn(
            'h-5 w-5',
            flagship ? 'text-primary' : 'text-primary/80',
          )}
        />
      </div>

      {/* Name */}
      <div>
        <h4
          className={cn(
            'text-base font-semibold',
            flagship ? 'text-foreground' : 'text-foreground',
          )}
        >
          {name}
        </h4>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>

      {/* Divider */}
      <div className="h-px bg-border/60" />

      {/* Price block */}
      <div>
        <div className="flex items-end gap-1.5">
          <span
            className={cn(
              'text-4xl font-bold tracking-tight',
              flagship ? 'text-primary' : 'text-foreground',
            )}
          >
            {price}
          </span>
        </div>
        <p className="mt-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          USDC per API call
        </p>
      </div>

      {/* CTA */}
      <Button
        asChild
        size="default"
        className={cn(
          'mt-auto w-full rounded-xl font-medium',
          flagship
            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30 hover:bg-primary/90'
            : 'border border-border/70 bg-transparent text-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary',
        )}
        variant={flagship ? 'default' : 'outline'}
      >
        <Link href="/app">Get started</Link>
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section                                                             */
/* ------------------------------------------------------------------ */

export function PricingSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      {/* Section header */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Pricing
        </h2>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Every price is per API call, denominated in USDC. No subscriptions,
          no minimums.
        </p>
      </div>

      {/* Atomic checks */}
      <div className="mb-14">
        <div className="mb-4 flex items-center gap-3">
          <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
            Atomic checks
          </p>
          <div className="h-px flex-1 bg-border/60" />
          <p className="text-[11px] text-muted-foreground">Run one job</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {ATOMIC_CHECKS.map((check) => (
            <AtomicCard key={check.name} {...check} />
          ))}
        </div>
      </div>

      {/* Bundles */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
            Bundles
          </p>
          <div className="h-px flex-1 bg-border/60" />
          <p className="text-[11px] text-muted-foreground">
            Multiple jobs + AI
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {BUNDLES.map((bundle) => (
            <BundleCard key={bundle.name} {...bundle} />
          ))}
        </div>
      </div>

      {/* Footer note */}
      <p className="mt-10 text-center text-xs text-muted-foreground">
        All prices are per API call in USDC, settled on Algorand via x402.{' '}
        <Link href="/docs" className="text-primary underline-offset-4 hover:underline">
          See the full API reference →
        </Link>
      </p>
    </section>
  );
}
