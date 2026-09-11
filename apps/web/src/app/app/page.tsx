'use client';

import { useState } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { AlertCircle } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { ReportView } from '@/components/report-view';
import { ValidateForm, TIERS, type Tier } from '@/components/validate-form';
import { createPaidApiClient } from '@/lib/x402-client';
import type { AnalysisReport, ApiEnvelope } from '@/lib/report-types';

function isAxiosErrorLike(err: unknown): err is {
  response?: { status?: number; data?: unknown };
  message: string;
} {
  return typeof err === 'object' && err !== null && 'message' in err;
}

export default function ValidatePage() {
  const { activeAddress, isReady, signTransactions } = useWallet();
  const [target, setTarget] = useState('');
  const [tier, setTier] = useState<Tier>('quick');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);

  // isReady is false on both the server and the client's first paint - the
  // wallet manager restores a persisted session asynchronously after mount,
  // so gating on it (rather than just activeAddress) keeps the first client
  // render identical to the server's and avoids a hydration mismatch once
  // the real session is restored. Same fix as WalletConnect.
  const canSubmit =
    isReady && !!activeAddress && target.trim().length > 0 && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeAddress) return;

    setLoading(true);
    setError(null);
    setReport(null);
    setStatus('Waiting for payment signature…');

    try {
      const api = createPaidApiClient({
        address: activeAddress,
        signTransactions: (txns, indexesToSign) =>
          signTransactions(txns, indexesToSign),
      });

      setStatus('Running validation…');
      const response = await api.post<ApiEnvelope<AnalysisReport>>(
        `/v1/validate/${tier}`,
        { target: target.trim() },
      );

      if (!response.data.success) {
        throw new Error(response.data.error ?? 'Validation failed.');
      }
      setReport(response.data.data);
    } catch (err) {
      if (isAxiosErrorLike(err)) {
        const data = err.response?.data;
        const message =
          typeof data === 'object' && data !== null && 'error' in data
            ? String((data as { error: unknown }).error)
            : err.message;
        setError(message);
      } else {
        setError('Something went wrong.');
      }
    } finally {
      setLoading(false);
      setStatus(null);
    }
  }

  const selectedTier = TIERS.find((t) => t.id === tier) ?? TIERS[0];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-4 py-16 sm:px-6 sm:py-24">
        <div className="w-full max-w-2xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Validate any startup in seconds
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-balance text-sm text-muted-foreground sm:text-base">
            Enter a domain, pick a tier, and get a deterministic,
            evidence-backed report. Paid per call, settled on Algorand.
          </p>
        </div>

        <div className="mt-8 w-full max-w-2xl">
          <ValidateForm
            target={target}
            onTargetChange={setTarget}
            tier={tier}
            onTierChange={setTier}
            onSubmit={handleSubmit}
            loading={loading}
            statusLabel={status}
            canSubmit={canSubmit}
          />
        </div>

        {isReady && !activeAddress ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Connect a wallet from the top right to run a{' '}
            {selectedTier.label.toLowerCase()}.
          </p>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="mt-6 flex w-full max-w-2xl items-start gap-2.5 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {report ? (
          <div className="mt-10 w-full max-w-4xl">
            <ReportView report={report} />
          </div>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
}
