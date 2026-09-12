'use client';

import { useState } from 'react';
import { Check, Download, Loader2 } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AnalysisReport } from '@/lib/report-types';
import { exportReport } from '@/lib/export-report';

interface ExportButtonProps extends Omit<ButtonProps, 'onClick'> {
  report: AnalysisReport | null;
}

export function ExportButton({
  report,
  className,
  variant = 'outline',
  size = 'sm',
  disabled,
  ...props
}: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const handleExport = () => {
    if (!report || exporting) return;

    setExporting(true);
    setTimeout(() => {
      const success = exportReport(report);
      setExporting(false);
      if (success) {
        setExported(true);
        setTimeout(() => setExported(false), 2000);
      }
    }, 150);
  };

  return (
    <Button
      variant={variant}
      size={size}
      disabled={disabled || !report || exporting}
      onClick={handleExport}
      className={cn('gap-2 font-medium', className)}
      title={report ? 'Export analysis report as JSON' : 'No report to export'}
      {...props}
    >
      {exporting ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : exported ? (
        <Check className="h-4 w-4 text-success" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      <span>{exported ? 'Exported' : 'Export'}</span>
    </Button>
  );
}
