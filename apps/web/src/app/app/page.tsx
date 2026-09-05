'use client';

import { useState } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { Nav } from '@/components/nav';
import { WalletConnect } from '@/components/wallet-connect';
import { ReportView } from '@/components/report-view';
import { createPaidApiClient } from '@/lib/x402-client';
import type { AnalysisReport, ApiEnvelope } from '@/lib/report-types';

type Tier = 'quick' | 'full';

const TIERS: Array<{ id: Tier; label: string; price: string }> = [
  { id: 'quick', label: 'Quick', price: '$0.50' },
  { id: 'full', label: 'Full', price: '$1.00' },
];

function isAxiosErrorLike(err: unknown): err is {
  response?: { status?: number; data?: unknown };
  message: string;
} {
  return typeof err === 'object' && err !== null && 'message' in err;
}

export default function AppPage() {
  const { activeAddress, signTransactions } = useWallet();
  const [target, setTarget] = useState('');
  const [tier, setTier] = useState<Tier>('quick');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);

  const canSubmit = !!activeAddress && target.trim().length > 0 && !loading;

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

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">
          Run a validation
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-400">
          Connect a testnet Algorand wallet, enter a domain, and pay per
          request in USDC. No account needed.
        </p>

        {!activeAddress ? (
          <div className="mt-8 flex items-center gap-4 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-200">
            <span>Connect a wallet to continue.</span>
            <WalletConnect />
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="target"
              className="block text-sm font-medium text-neutral-300"
            >
              Domain
            </label>
            <input
              id="target"
              type="text"
              placeholder="stripe.com"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-black px-4 py-2.5 text-sm text-neutral-100 outline-none focus:border-emerald-400/50"
            />
          </div>

          <div className="flex gap-3">
            {TIERS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTier(t.id)}
                className={`flex-1 rounded-xl border p-4 text-left transition ${
                  tier === t.id
                    ? 'border-emerald-400/50 bg-emerald-400/5'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="text-sm font-medium text-neutral-100">
                  {t.label}
                </div>
                <div className="text-xs text-neutral-500">{t.price}</div>
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-medium text-neutral-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading
              ? (status ?? 'Working…')
              : `Validate for ${TIERS.find((t) => t.id === tier)?.price}`}
          </button>
        </form>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        {report ? (
          <div className="mt-10">
            <ReportView report={report} />
          </div>
        ) : null}
      </main>
    </>
  );
}
