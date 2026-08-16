'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientPortalGate() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/client-portal/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json()) as { success: boolean; error?: string };

      if (data.success) {
        router.refresh();
      } else {
        setError(data.error ?? 'Invalid access code. Please try again.');
      }
    } catch {
      setError('Unable to verify code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <span className="inline-block rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-200 mb-4">
            Think Easy Agency
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Client Portal</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            This portal is exclusively for Think Easy Agency clients.
            Enter your company-issued access code to continue.
          </p>
        </div>

        {/* Gate card */}
        <div className="rounded-2xl border border-cyan-900/40 bg-slate-900 p-6 sm:p-8 shadow-2xl shadow-slate-950/40">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="access-code"
                className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
              >
                Access Code
              </label>
              <input
                id="access-code"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your access code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50"
              />
            </div>

            {error ? (
              <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Verifying…' : 'Access Portal'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          Don&apos;t have an access code? Contact your Think Easy Agency account representative.
        </p>
      </div>
    </main>
  );
}
