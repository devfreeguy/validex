'use client';

import { Loader2, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const COMPARE_PRICE = '$0.15';
export const COMPARE_MIN_TARGETS = 2;
export const COMPARE_MAX_TARGETS = 5;

interface CompareFormProps {
  targets: string[];
  onTargetsChange: (targets: string[]) => void;
  onSubmit: (event: React.FormEvent) => void;
  loading: boolean;
  statusLabel?: string | null;
  canSubmit: boolean;
}

export function CompareForm({
  targets,
  onTargetsChange,
  onSubmit,
  loading,
  statusLabel,
  canSubmit,
}: CompareFormProps) {
  function updateTarget(index: number, value: string) {
    const next = [...targets];
    next[index] = value;
    onTargetsChange(next);
  }

  function addTarget() {
    if (targets.length >= COMPARE_MAX_TARGETS) return;
    onTargetsChange([...targets, '']);
  }

  function removeTarget(index: number) {
    if (targets.length <= COMPARE_MIN_TARGETS) return;
    onTargetsChange(targets.filter((_, i) => i !== index));
  }

  const filledCount = targets.filter((t) => t.trim().length > 0).length;

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="flex flex-col gap-2 rounded-3xl border border-border bg-card p-3 shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-ring/40">
        {targets.map((value, index) => (
          <div key={index} className="flex items-center gap-2">
            <label htmlFor={`compare-target-${index}`} className="sr-only">
              Domain {index + 1}
            </label>
            <Input
              id={`compare-target-${index}`}
              type="text"
              inputMode="url"
              autoComplete="off"
              placeholder={`Domain ${index + 1}…`}
              value={value}
              onChange={(e) => updateTarget(index, e.target.value)}
              className="h-11 flex-1 rounded-full"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full text-muted-foreground"
              onClick={() => removeTarget(index)}
              disabled={targets.length <= COMPARE_MIN_TARGETS}
              aria-label={`Remove domain ${index + 1}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <div className="flex items-center justify-between gap-2 px-1 pt-1">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-1.5 rounded-full"
            onClick={addTarget}
            disabled={targets.length >= COMPARE_MAX_TARGETS}
          >
            <Plus className="h-3.5 w-3.5" />
            Add domain
          </Button>

          <Button
            type="submit"
            disabled={!canSubmit}
            className="gap-2 rounded-full px-5"
            aria-label={loading ? 'Running comparison' : 'Run comparison'}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              `Compare${filledCount > 0 ? ` (${filledCount})` : ''}`
            )}
          </Button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-2 text-xs text-muted-foreground">
        <span>
          {loading && statusLabel
            ? statusLabel
            : `Paid per request in USDC on Algorand - Compare costs ${COMPARE_PRICE} for 2-5 domains.`}
        </span>
      </div>
    </form>
  );
}
