'use client';

import { useState } from 'react';
import { Check, Download, Loader2 } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ExportButtonProps<T> extends Omit<ButtonProps, 'onClick'> {
  data: T | null;
  exportFn: (data: T) => boolean;
  label?: string;
}

export function ExportButton<T>({
  data,
  exportFn,
  label = 'Export',
  className,
  variant = 'outline',
  size = 'sm',
  disabled,
  ...props
}: ExportButtonProps<T>) {
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const handleExport = () => {
    if (!data || exporting) return;

    setExporting(true);
    setTimeout(() => {
      const success = exportFn(data);
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
      disabled={disabled || !data || exporting}
      onClick={handleExport}
      className={cn('gap-2 font-medium', className)}
      title={data ? `${label} as JSON` : 'Nothing to export'}
      {...props}
    >
      {exporting ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : exported ? (
        <Check className="h-4 w-4 text-success" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      <span>{exported ? 'Exported' : label}</span>
    </Button>
  );
}
