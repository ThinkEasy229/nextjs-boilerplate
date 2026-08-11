'use client';

import { useEffect, useState } from 'react';

interface LookupResult {
  id: string;
  name: string;
  status: string;
  accessCode: string | null;
  notes: string;
  timeline: { status: string; changedAt: string; changedBy: string; note?: string }[];
}

export default function DriverStatusPage() {
  const [id, setId] = useState('');
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<LookupResult | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    setId(searchParams.get('id') ?? '');
    setEmail(searchParams.get('email') ?? '');
  }, []);

  async function lookup() {
    const response = await fetch(`/api/driver-applications/${id}?email=${encodeURIComponent(email)}`);
    const json = (await response.json()) as { success: boolean; error?: string; data?: LookupResult };
    if (!json.success || !json.data) {
      setResult(null);
      setMessage(json.error ?? 'Application not found.');
      return;
    }
    setMessage('');
    setResult(json.data);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 pt-20">
      <div className="mx-auto max-w-2xl rounded-3xl border border-cyan-500/20 bg-slate-900/70 p-8">
        <h1 className="text-3xl font-bold text-white">Check driver application status</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Enter your application ID and email address to review the approval timeline, status, and access code once approved.
        </p>
        <div className="mt-6 grid gap-4">
          <input className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white" placeholder="Application ID" value={id} onChange={(event) => setId(event.target.value)} />
          <input className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
        <button className="mt-5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-white" onClick={() => { void lookup(); }} type="button">
          Check status
        </button>
        {message ? <p className="mt-4 text-sm text-rose-200">{message}</p> : null}
        {result ? (
          <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
            <p className="text-sm font-semibold text-white">{result.name}</p>
            <p className="mt-2 text-sm text-cyan-200">Status: {result.status}</p>
            {result.accessCode ? <p className="mt-2 text-sm text-cyan-200">Access code: {result.accessCode}</p> : null}
            {result.notes ? <p className="mt-2 text-sm text-slate-300">Notes: {result.notes}</p> : null}
            <div className="mt-5 space-y-2">
              {result.timeline.map((entry) => (
                <p key={`${entry.status}-${entry.changedAt}`} className="text-sm text-slate-300">
                  {entry.status} · {new Date(entry.changedAt).toLocaleString()} · {entry.changedBy}
                </p>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
