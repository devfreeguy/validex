import type { AnalysisReport } from '@/lib/report-types';

function scoreColor(score: number | null): string {
  if (score === null) return 'text-neutral-500';
  if (score >= 80) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-red-400';
}

export function ReportView({ report }: { report: AnalysisReport }) {
  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <div className="text-sm text-neutral-500">
              {report.company.domain}
            </div>
            <div className="text-lg font-medium">
              {report.company.companyName ?? report.company.domain}
            </div>
          </div>
          <div className="text-right">
            <div
              className={`text-4xl font-semibold ${scoreColor(report.summary.score)}`}
            >
              {report.summary.score ?? '—'}
            </div>
            <div className="text-sm text-neutral-500">
              Grade {report.summary.grade} · {report.summary.confidence}%
              confidence
            </div>
          </div>
        </div>
        {report.summary.executiveSummary ? (
          <p className="mt-4 text-sm leading-relaxed text-neutral-400">
            {report.summary.executiveSummary}
          </p>
        ) : null}
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-sm font-medium text-neutral-400">Categories</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {Object.entries(report.categories)
            .filter(([, cat]) => cat.validatorsEvaluated > 0)
            .map(([name, cat]) => (
              <div
                key={name}
                className="rounded-xl border border-white/10 p-4"
              >
                <div className="text-xs uppercase tracking-wide text-neutral-500">
                  {name}
                </div>
                <div className={`mt-1 text-xl font-medium ${scoreColor(cat.score)}`}>
                  {cat.score ?? '—'}
                </div>
                <div className="mt-1 text-xs text-neutral-500">
                  {cat.validatorsEvaluated - cat.validatorsUnavailable}/
                  {cat.validatorsEvaluated} checks · weight {cat.weight}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Strengths / weaknesses */}
      {report.strengths.length > 0 || report.weaknesses.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {report.strengths.length > 0 ? (
            <div>
              <h3 className="text-sm font-medium text-emerald-400">
                Strengths
              </h3>
              <ul className="mt-2 space-y-1.5 text-sm text-neutral-400">
                {report.strengths.map((s, i) => (
                  <li key={i}>· {s}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {report.weaknesses.length > 0 ? (
            <div>
              <h3 className="text-sm font-medium text-red-400">Weaknesses</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-neutral-400">
                {report.weaknesses.map((w, i) => (
                  <li key={i}>· {w}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Validators */}
      <div>
        <h3 className="text-sm font-medium text-neutral-400">
          Validators ({report.validators.length})
        </h3>
        <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-2">Validator</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Score</th>
              </tr>
            </thead>
            <tbody>
              {report.validators.map((v) => (
                <tr key={v.validatorId} className="border-t border-white/5">
                  <td className="px-4 py-2 text-neutral-200">{v.name}</td>
                  <td className="px-4 py-2 text-neutral-500">{v.category}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        v.status === 'success'
                          ? 'text-emerald-400'
                          : v.status === 'error'
                            ? 'text-red-400'
                            : 'text-neutral-500'
                      }
                    >
                      {v.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-neutral-300">
                    {v.score ?? '—'} / {v.maxScore}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sources */}
      {report.sources.length > 0 ? (
        <div>
          <h3 className="text-sm font-medium text-neutral-400">Sources</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {report.sources.map((source) => (
              <span
                key={source.name}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-400"
              >
                {source.name}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
