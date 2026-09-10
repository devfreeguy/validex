import {
  AlertTriangle,
  CheckCircle2,
  Compass,
  Lightbulb,
  Sparkles,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { AnalysisReport, Recommendation } from '@/lib/report-types';

type ScoreVariant = 'success' | 'warning' | 'destructive' | 'muted';

function scoreVariant(score: number | null): ScoreVariant {
  if (score === null) return 'muted';
  if (score >= 80) return 'success';
  if (score >= 50) return 'warning';
  return 'destructive';
}

const SCORE_TEXT_CLASS: Record<ScoreVariant, string> = {
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
  muted: 'text-muted-foreground',
};

const STATUS_BADGE_VARIANT: Record<string, BadgeProps['variant']> = {
  success: 'success',
  error: 'destructive',
  unavailable: 'muted',
};

const RECOMMENDATION_CONFIG: Record<
  Recommendation,
  { label: string; variant: BadgeProps['variant']; icon: typeof CheckCircle2 }
> = {
  integrate: {
    label: 'INTEGRATE',
    variant: 'success',
    icon: CheckCircle2,
  },
  caution: {
    label: 'CAUTION',
    variant: 'warning',
    icon: AlertTriangle,
  },
  avoid: {
    label: 'AVOID',
    variant: 'destructive',
    icon: XCircle,
  },
};

export function ReportView({ report }: { report: AnalysisReport }) {
  const categories = Object.entries(report.categories).filter(
    ([, cat]) => cat.validatorsEvaluated > 0,
  );

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="text-sm text-muted-foreground">
                {report.company.domain}
              </div>
              <div className="mt-1 text-xl font-semibold tracking-tight">
                {report.company.companyName ?? report.company.domain}
              </div>
              {report.meta.cached ? (
                <Badge variant="muted" className="mt-2">
                  Cached result
                </Badge>
              ) : null}
            </div>
            <div className="text-right">
              <div
                className={cn(
                  'text-4xl font-bold tabular-nums',
                  SCORE_TEXT_CLASS[scoreVariant(report.summary.score)],
                )}
              >
                {report.summary.score ?? '-'}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                Grade {report.summary.grade} · {report.summary.confidence}%
                confidence
              </div>
            </div>
          </div>
          {!report.verdict && report.summary.executiveSummary ? (
            <p className="mt-5 border-t border-border pt-5 text-sm leading-relaxed text-muted-foreground">
              {report.summary.executiveSummary}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {/* AI Verdict & Summary */}
      {report.verdict ? (
        <Card className="border-primary/25 bg-linear-to-b from-primary/5 via-card to-card">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-semibold">
                  AI Analysis & Verdict
                </CardTitle>
              </div>
              {report.verdict.recommendation && (
                <Badge
                  variant={
                    RECOMMENDATION_CONFIG[report.verdict.recommendation]?.variant ??
                    'default'
                  }
                  className="px-3 py-1 font-semibold tracking-wide"
                >
                  {(() => {
                    const RecIcon =
                      RECOMMENDATION_CONFIG[report.verdict.recommendation]?.icon ??
                      Sparkles;
                    return (
                      <>
                        <RecIcon className="h-3.5 w-3.5" />
                        <span>
                          {RECOMMENDATION_CONFIG[report.verdict.recommendation]
                            ?.label ?? report.verdict.recommendation.toUpperCase()}
                        </span>
                      </>
                    );
                  })()}
                </Badge>
              )}
            </div>
            {report.verdict.executiveSummary ? (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {report.verdict.executiveSummary}
              </p>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Risk Flags */}
            {report.verdict.riskFlags && report.verdict.riskFlags.length > 0 ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Identified Risk Flags</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {report.verdict.riskFlags.map((risk, idx) => (
                    <Badge key={idx} variant="destructive" className="font-normal">
                      {risk}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Insights & Suggestions & Opportunities Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Insights */}
              {report.verdict.insights && report.verdict.insights.length > 0 ? (
                <div className="rounded-lg border border-border bg-card p-3.5">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                    <Lightbulb className="h-4 w-4 shrink-0" />
                    <span>Key Insights</span>
                  </div>
                  <ul className="mt-2.5 space-y-2 text-xs leading-relaxed text-muted-foreground">
                    {report.verdict.insights.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* Suggestions */}
              {report.verdict.suggestions && report.verdict.suggestions.length > 0 ? (
                <div className="rounded-lg border border-border bg-card p-3.5">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                    <Compass className="h-4 w-4 shrink-0" />
                    <span>Suggestions</span>
                  </div>
                  <ul className="mt-2.5 space-y-2 text-xs leading-relaxed text-muted-foreground">
                    {report.verdict.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* Opportunities */}
              {report.verdict.opportunities && report.verdict.opportunities.length > 0 ? (
                <div className="rounded-lg border border-border bg-card p-3.5">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                    <TrendingUp className="h-4 w-4 shrink-0" />
                    <span>Opportunities</span>
                  </div>
                  <ul className="mt-2.5 space-y-2 text-xs leading-relaxed text-muted-foreground">
                    {report.verdict.opportunities.map((opp, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{opp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            {/* Category Narrative */}
            {report.verdict.categoryNarrative &&
            Object.keys(report.verdict.categoryNarrative).length > 0 ? (
              <div className="rounded-lg border border-border bg-card/50 p-3.5">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Category Breakdown Narrative
                </div>
                <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
                  {Object.entries(report.verdict.categoryNarrative).map(
                    ([cat, narrative]) => (
                      <div
                        key={cat}
                        className="rounded border border-border/50 bg-background/50 p-2.5 text-xs text-muted-foreground"
                      >
                        <span className="font-semibold uppercase tracking-wide text-foreground">
                          {cat}:{' '}
                        </span>
                        <span>{narrative}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* Categories */}
      {categories.length > 0 ? (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Categories
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map(([name, cat]) => (
              <Card key={name}>
                <CardContent className="p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {name}
                  </div>
                  <div
                    className={cn(
                      'mt-1 text-2xl font-semibold tabular-nums',
                      SCORE_TEXT_CLASS[scoreVariant(cat.score)],
                    )}
                  >
                    {cat.score ?? '-'}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {cat.validatorsEvaluated - cat.validatorsUnavailable}/
                    {cat.validatorsEvaluated} checks · weight {cat.weight}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      {/* Strengths / weaknesses */}
      {report.strengths.length > 0 || report.weaknesses.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {report.strengths.length > 0 ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-success">
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {report.strengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{s}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
          {report.weaknesses.length > 0 ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-destructive">
                  Weaknesses
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {report.weaknesses.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <span>{w}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      {/* Validators */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">
            Validators ({report.validators.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Validator</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.validators.map((v) => (
                <TableRow key={v.validatorId}>
                  <TableCell className="font-medium text-foreground">
                    {v.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {v.category}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE_VARIANT[v.status] ?? 'muted'}>
                      {v.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {v.score ?? '-'} / {v.maxScore}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Sources */}
      {report.sources.length > 0 ? (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Sources
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {report.sources.map((source) =>
              source.url ? (
                <a
                  key={source.name}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Badge variant="outline" className="hover:bg-accent">
                    {source.name}
                  </Badge>
                </a>
              ) : (
                <Badge key={source.name} variant="outline">
                  {source.name}
                </Badge>
              ),
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
