import { CheckCircle2, XCircle } from 'lucide-react';
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
import type { AnalysisReport } from '@/lib/report-types';

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
          {report.summary.executiveSummary ? (
            <p className="mt-5 border-t border-border pt-5 text-sm leading-relaxed text-muted-foreground">
              {report.summary.executiveSummary}
            </p>
          ) : null}
        </CardContent>
      </Card>

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
