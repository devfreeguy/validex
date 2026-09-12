import type { AnalysisReport } from '@/lib/report-types';

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

  try {
    const rawDomain = report.company?.domain ?? 'report';
    const sanitizedDomain = rawDomain
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9.-]/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `validex-report-${sanitizedDomain}-${dateStr}.json`;

    const jsonString = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
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
    console.error('Failed to export analysis report:', err);
    return false;
  }
}
