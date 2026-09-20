'use client';

import { Fragment, useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Crown,
  Lightbulb,
  Sparkles,
  Trophy,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type {
  AnalysisReport,
  ComparisonReport,
  ComparisonVerdict,
} from '@/lib/report-types';
import { ReportView } from '@/components/report-view';
import { ExportButton } from '@/components/export-button';
import { exportComparison } from '@/lib/export-report';

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

// Matches ValidatorCategory in the API (analysis.types.ts) - fixed display
// order (weight-descending) rather than object key order, which isn't
// guaranteed to be stable.
const CATEGORY_ORDER = [
  'security',
  'trust',
  'engineering',
  'product',
  'growth',
  'website',
];

/** Index of the unique highest score in a row, or null if there's a tie or no data. */
function soleLeaderIndex(scores: Array<number | null>): number | null {
  const valid = scores.filter((s): s is number => s !== null);
  if (valid.length === 0) return null;
  const max = Math.max(...valid);
  const leaders = scores.reduce<number[]>(
    (acc, s, i) => (s === max ? [...acc, i] : acc),
    [],
  );
  return leaders.length === 1 ? leaders[0] : null;
}

function CategoryLeadershipBadges({ results }: { results: AnalysisReport[] }) {
  const categories = CATEGORY_ORDER.filter((cat) =>
    results.some((r) => (r.categories[cat]?.validatorsEvaluated ?? 0) > 0),
  );
  const leaderCounts = new Map<string, number>();
  categories.forEach((cat) => {
    const scores = results.map((r) => r.categories[cat]?.score ?? null);
    const leaderIdx = soleLeaderIndex(scores);
    if (leaderIdx !== null) {
      const domain = results[leaderIdx].company.domain;
      leaderCounts.set(domain, (leaderCounts.get(domain) ?? 0) + 1);
    }
  });

  if (categories.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-4 pb-4">
      {results.map((r) => {
        const count = leaderCounts.get(r.company.domain) ?? 0;
        return (
          <Badge
            key={r.meta.analysisId}
            variant={count > 0 ? 'success' : 'muted'}
            className="gap-1 font-normal"
          >
            {count > 0 ? <Crown className="h-3 w-3" /> : null}
            {r.company.domain} leads {count}/{categories.length} categories
          </Badge>
        );
      })}
    </div>
  );
}

function ComparisonVerdictCard({
  verdict,
  results,
}: {
  verdict: ComparisonVerdict;
  results: AnalysisReport[];
}) {
  const winner = results.find((r) => r.company.domain === verdict.winnerDomain);
  const hasContent =
    verdict.executiveSummary ||
    (verdict.winningFactors && verdict.winningFactors.length > 0) ||
    (verdict.lessons && verdict.lessons.length > 0);

  if (!hasContent) return null;

  return (
    <Card className="border-primary/25 bg-linear-to-b from-primary/5 via-card to-card">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle className="text-base font-semibold">
            AI Comparison Verdict
          </CardTitle>
          <Badge variant="success" className="gap-1 px-3 py-1 font-semibold">
            <Crown className="h-3.5 w-3.5" />
            {winner?.company.companyName ?? verdict.winnerDomain} wins
          </Badge>
        </div>
        {verdict.executiveSummary ? (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {verdict.executiveSummary}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {verdict.winningFactors && verdict.winningFactors.length > 0 ? (
          <div className="rounded-lg border border-border bg-card p-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <Trophy className="h-4 w-4 shrink-0" />
              <span>Why {verdict.winnerDomain} leads</span>
            </div>
            <ul className="mt-2.5 space-y-2 text-xs leading-relaxed text-muted-foreground">
              {verdict.winningFactors.map((factor, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {verdict.lessons && verdict.lessons.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {verdict.lessons.map((lesson) => (
              <div
                key={lesson.domain}
                className="rounded-lg border border-border bg-card p-3.5"
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground">
                  <Lightbulb className="h-4 w-4 shrink-0 text-primary" />
                  <span>Lessons for {lesson.domain}</span>
                </div>
                <ul className="mt-2.5 space-y-2 text-xs leading-relaxed text-muted-foreground">
                  {lesson.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function CategoryComparisonTable({ results }: { results: AnalysisReport[] }) {
  const categories = CATEGORY_ORDER.filter((cat) =>
    results.some((r) => (r.categories[cat]?.validatorsEvaluated ?? 0) > 0),
  );

  if (categories.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">
          Category scores, head-to-head
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 pb-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              {results.map((r) => (
                <TableHead key={r.meta.analysisId} className="text-right">
                  {r.company.domain}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat) => {
              const scores = results.map((r) => r.categories[cat]?.score ?? null);
              const leaderIdx = soleLeaderIndex(scores);
              return (
                <TableRow key={cat}>
                  <TableCell className="font-medium capitalize text-foreground">
                    {cat}
                  </TableCell>
                  {results.map((r, i) => (
                    <TableCell
                      key={r.meta.analysisId}
                      className={cn(
                        'text-right tabular-nums',
                        SCORE_TEXT_CLASS[scoreVariant(scores[i])],
                        leaderIdx === i && 'font-semibold',
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        {leaderIdx === i ? (
                          <Crown className="h-3 w-3 text-warning" />
                        ) : null}
                        {scores[i] ?? '-'}
                      </span>
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ValidatorComparisonTable({ results }: { results: AnalysisReport[] }) {
  // The compare tier always runs the full validator set (TIER_VALIDATOR_MAP
  // compare: { all: true }) for every target, so validatorId is a stable
  // join key across results - a validator missing for one domain still
  // appears in its `validators` array (as an error/unavailable entry), it's
  // never just absent.
  const validatorMeta = new Map<
    string,
    { name: string; category: string; maxScore: number }
  >();
  results.forEach((r) => {
    r.validators.forEach((v) => {
      if (!validatorMeta.has(v.validatorId)) {
        validatorMeta.set(v.validatorId, {
          name: v.name,
          category: v.category,
          maxScore: v.maxScore,
        });
      }
    });
  });

  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    validatorIds: [...validatorMeta.entries()]
      .filter(([, meta]) => meta.category === category)
      .map(([id]) => id),
  })).filter((g) => g.validatorIds.length > 0);

  if (grouped.length === 0) return null;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Validator</TableHead>
          {results.map((r) => (
            <TableHead key={r.meta.analysisId} className="text-right">
              {r.company.domain}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {grouped.map((group) => (
          <Fragment key={group.category}>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableCell
                colSpan={results.length + 1}
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {group.category}
              </TableCell>
            </TableRow>
            {group.validatorIds.map((id) => {
              const meta = validatorMeta.get(id)!;
              const entries = results.map(
                (r) => r.validators.find((v) => v.validatorId === id) ?? null,
              );
              const scores = entries.map((v) => v?.score ?? null);
              const leaderIdx = soleLeaderIndex(scores);
              return (
                <TableRow key={id}>
                  <TableCell className="text-muted-foreground">
                    {meta.name}
                  </TableCell>
                  {entries.map((v, i) => (
                    <TableCell
                      key={results[i].meta.analysisId}
                      className={cn(
                        'text-right tabular-nums text-muted-foreground',
                        leaderIdx === i && 'font-semibold text-success',
                      )}
                    >
                      {v ? `${v.score ?? '-'}/${meta.maxScore}` : '-'}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </Fragment>
        ))}
      </TableBody>
    </Table>
  );
}

export function ComparisonView({
  comparison,
}: {
  comparison: ComparisonReport;
}) {
  const [showValidatorDetail, setShowValidatorDetail] = useState(false);
  // Individual reports are collapsed by default - up to 5 full ReportViews
  // stacked open at once would be a lot of scrolling for what's meant to be
  // a quick ranked overview.
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-sm text-muted-foreground">
            Ranking · {comparison.meta.targetCount} domains
          </CardTitle>
          <ExportButton data={comparison} exportFn={exportComparison} />
        </CardHeader>
        <CardContent className="p-0 pb-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Rank</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead className="text-right">Confidence</TableHead>
                <TableHead className="text-right">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparison.ranking.map((entry) => (
                <TableRow key={entry.analysisId}>
                  <TableCell className="font-medium tabular-nums text-muted-foreground">
                    {entry.rank === 1 ? (
                      <Crown className="inline h-3.5 w-3.5 text-warning" />
                    ) : (
                      `#${entry.rank}`
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {entry.domain}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {entry.grade}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {entry.confidence}%
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-right text-lg font-semibold tabular-nums',
                      SCORE_TEXT_CLASS[scoreVariant(entry.score)],
                    )}
                  >
                    {entry.score ?? '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CategoryLeadershipBadges results={comparison.results} />
      </Card>

      {comparison.verdict ? (
        <ComparisonVerdictCard
          verdict={comparison.verdict}
          results={comparison.results}
        />
      ) : null}

      <CategoryComparisonTable results={comparison.results} />

      {comparison.results.length > 0 ? (
        <Card>
          <button
            type="button"
            onClick={() => setShowValidatorDetail((v) => !v)}
            className="flex w-full items-center justify-between gap-3 p-4 text-left"
            aria-expanded={showValidatorDetail}
          >
            <CardTitle className="text-sm text-muted-foreground">
              Validator-by-validator breakdown
            </CardTitle>
            {showValidatorDetail ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {showValidatorDetail ? (
            <CardContent className="border-t border-border p-0 pb-2 pt-0">
              <ValidatorComparisonTable results={comparison.results} />
            </CardContent>
          ) : null}
        </Card>
      ) : null}

      {comparison.failed.length > 0 ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Failed targets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {comparison.failed.map((entry) => (
              <div
                key={entry.target}
                className="text-sm text-muted-foreground"
              >
                <span className="font-medium text-foreground">
                  {entry.target}
                </span>{' '}
                - {entry.error}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {comparison.results.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Individual reports
          </h3>
          {comparison.results.map((report) => {
            const isOpen = expandedId === report.meta.analysisId;
            return (
              <Card key={report.meta.analysisId}>
                <button
                  type="button"
                  onClick={() =>
                    setExpandedId(isOpen ? null : report.meta.analysisId)
                  }
                  className="flex w-full items-center justify-between gap-3 p-4 text-left"
                  aria-expanded={isOpen}
                >
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {report.company.companyName ?? report.company.domain}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {report.company.domain}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'text-xl font-semibold tabular-nums',
                        SCORE_TEXT_CLASS[scoreVariant(report.summary.score)],
                      )}
                    >
                      {report.summary.score ?? '-'}
                    </div>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>
                {isOpen ? (
                  <CardContent className="border-t border-border pt-4">
                    <ReportView report={report} />
                  </CardContent>
                ) : null}
              </Card>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
