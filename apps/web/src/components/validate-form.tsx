'use client';

import {
  ArrowRight,
  ChevronDown,
  Code2,
  FileText,
  Globe2,
  Layers,
  Loader2,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// One entry per single-target endpoint - compare (/v1/validate/compare)
// takes 2-5 targets instead of one, so it needs its own multi-domain input
// and isn't offered from this single-target dropdown.
export type Tier =
  | 'security'
  | 'trust'
  | 'web'
  | 'engineering'
  | 'ai'
  | 'quick'
  | 'full';

export interface TierOption {
  id: Tier;
  label: string;
  price: string;
  description: string;
  icon: typeof Zap;
}

export const TIERS: TierOption[] = [
  {
    id: 'security',
    label: 'Security',
    price: '$0.05',
    description: 'TLS, security headers, SPF, DMARC, MX.',
    icon: ShieldCheck,
  },
  {
    id: 'trust',
    label: 'Trust',
    price: '$0.05',
    description: 'HTTPS, domain age, privacy policy, terms, contact, about.',
    icon: FileText,
  },
  {
    id: 'web',
    label: 'Web Presence',
    price: '$0.06',
    description: 'Pricing, documentation, blog, careers, changelog.',
    icon: Globe2,
  },
  {
    id: 'engineering',
    label: 'Engineering',
    price: '$0.08',
    description:
      'GitHub activity, contributors, release cadence, issues, PRs, vulnerabilities.',
    icon: Code2,
  },
  {
    id: 'ai',
    label: 'AI Analysis',
    price: '$0.15',
    description:
      'Full company analysis with an AI verdict: recommendation, risk flags, category narrative.',
    icon: Sparkles,
  },
  {
    id: 'quick',
    label: 'Quick',
    price: '$0.20',
    description:
      'Security and trust checks with AI analysis. Fast, network-level, no crawl.',
    icon: Zap,
  },
  {
    id: 'full',
    label: 'Full',
    price: '$0.35',
    description: 'Every category with AI analysis. The complete report.',
    icon: Layers,
  },
];

interface ValidateFormProps {
  target: string;
  onTargetChange: (value: string) => void;
  tier: Tier;
  onTierChange: (tier: Tier) => void;
  onSubmit: (event: React.FormEvent) => void;
  loading: boolean;
  statusLabel?: string | null;
  canSubmit: boolean;
}

export function ValidateForm({
  target,
  onTargetChange,
  tier,
  onTierChange,
  onSubmit,
  loading,
  statusLabel,
  canSubmit,
}: ValidateFormProps) {
  const selected = TIERS.find((t) => t.id === tier) ?? TIERS[0];

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="flex w-full flex-col gap-2 rounded-3xl border border-border bg-card p-2 shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-ring/40 sm:flex-row sm:items-center sm:rounded-full">
        <label htmlFor="target" className="sr-only">
          Domain name
        </label>
        <Input
          id="target"
          type="text"
          inputMode="url"
          autoComplete="off"
          placeholder="Enter domain name…"
          value={target}
          onChange={(e) => onTargetChange(e.target.value)}
          className="h-11 flex-1 border-0 bg-transparent px-4 shadow-none focus-visible:ring-0"
        />

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="secondary"
                className="h-11 flex-1 justify-between gap-2 rounded-full px-4 sm:flex-none"
              >
                <span className="flex items-center gap-1.5">
                  <selected.icon className="h-4 w-4 text-primary" />
                  {selected.label}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-72 max-h-[min(20rem,var(--radix-dropdown-menu-content-available-height))] overflow-y-auto"
            >
              {TIERS.map((option) => (
                <DropdownMenuItem
                  key={option.id}
                  onSelect={() => onTierChange(option.id)}
                  className={cn(
                    'flex items-start gap-3 py-2.5',
                    option.id === tier && 'bg-accent',
                  )}
                >
                  <option.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-foreground">
                        {option.label}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {option.price}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            type="submit"
            size="icon"
            disabled={!canSubmit}
            aria-label={loading ? 'Running validation' : 'Run validation'}
            className="h-11 w-11 shrink-0 rounded-full"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-2 text-xs text-muted-foreground">
        <span>
          {loading && statusLabel
            ? statusLabel
            : `Paid per request in USDC on Algorand - ${selected.label} costs ${selected.price}.`}
        </span>
      </div>
    </form>
  );
}
