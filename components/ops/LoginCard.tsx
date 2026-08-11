'use client';

import { useMemo, useState } from 'react';

interface LoginCardProps {
  title: string;
  description: string;
  roleHint: string;
  redirectTo: string;
  demoCredentials: { label: string; email: string; password: string }[];
  footer?: React.ReactNode;
}

export default function LoginCard({
  title,
  description,
  roleHint,
  redirectTo,
  demoCredentials,
  footer,
}: LoginCardProps) {
  const [email, setEmail] = useState(demoCredentials[0]?.email ?? '');
  const [password, setPassword] = useState(demoCredentials[0]?.password ?? '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const redirect = useMemo(() => {
    if (typeof window === 'undefined') {
      return redirectTo;
    }
    return new URLSearchParams(window.location.search).get('redirect') || redirectTo;
  }, [redirectTo]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = (await response.json()) as {
        success: boolean;
        error?: string;
        session?: { role: string; email: string; name: string };
      };

      if (!json.success || !json.session) {
        setError(json.error ?? 'Unable to sign in.');
        return;
      }

      sessionStorage.setItem('thinkeasy.session', JSON.stringify(json.session));
      window.location.assign(redirect);
    } catch {
      setError('Unable to sign in right now.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 pt-20 px-4">
      <div className="mx-auto max-w-xl rounded-3xl border border-cyan-500/20 bg-slate-900/70 p-8 shadow-2xl shadow-cyan-950/20">
        <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
          {roleHint}
        </span>
        <h1 className="mt-4 text-3xl font-bold text-white">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">Email</span>
            <input
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">Password</span>
            <input
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          <button
            className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-white transition hover:from-cyan-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? 'Signing in…' : 'Access portal'}
          </button>
        </form>

        {demoCredentials.length > 0 ? (
          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {demoCredentials.map((credential) => (
              <button
                key={credential.email}
                className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4 text-left transition hover:border-cyan-500/40"
                onClick={() => {
                  setEmail(credential.email);
                  setPassword(credential.password);
                }}
                type="button"
              >
                <p className="text-sm font-semibold text-white">{credential.label}</p>
                <p className="mt-1 text-xs text-slate-400">{credential.email}</p>
                <p className="mt-1 text-xs text-cyan-200">{credential.password}</p>
              </button>
            ))}
          </div>
        ) : null}
        {footer ? <div className="mt-6 text-sm text-slate-300">{footer}</div> : null}
      </div>
    </div>
  );
}
