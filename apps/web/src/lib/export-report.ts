import type { AnalysisReport, ComparisonReport } from '@/lib/report-types';

function sanitize(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9.-]/g, '_');
}

function downloadJson(data: unknown, filename: string): boolean {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('Failed to export JSON:', err);
    return false;
  }
}

/**
 * Serializes an AnalysisReport object to JSON and triggers a browser file download.
 *
 * @param report The analysis report to export.
 * @returns boolean true if download was triggered successfully, false otherwise.
 */
export function exportReport(report: AnalysisReport): boolean {
  if (!report || typeof report !== 'object') {
    return false;
  }

  const domain = sanitize(report.company?.domain ?? 'report');
  const dateStr = new Date().toISOString().slice(0, 10);
  return downloadJson(report, `validex-report-${domain}-${dateStr}.json`);
}

/**
 * Serializes a ComparisonReport (ranking, category scores, full per-domain
 * reports, and the AI verdict when present) to JSON and triggers a browser
 * file download.
 *
 * @param comparison The comparison report to export.
 * @returns boolean true if download was triggered successfully, false otherwise.
 */
export function exportComparison(comparison: ComparisonReport): boolean {
  if (!comparison || typeof comparison !== 'object') {
    return false;
  }

  const domains =
    comparison.ranking.map((entry) => sanitize(entry.domain)).join('-vs-') ||
    'domains';
  const dateStr = new Date().toISOString().slice(0, 10);
  return downloadJson(comparison, `validex-compare-${domains}-${dateStr}.json`);
}
