'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ClientRegisterPage() {
  const [form, setForm] = useState({
    companyName: '',
    email: '',
    contactName: '',
    phone: '',
    password: '',
    inviteCode: '',
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const inviteCode = new URLSearchParams(window.location.search).get('invite');
    if (inviteCode) {
      setForm((current) => ({ ...current, inviteCode }));
    }
  }, []);

  async function register() {
    const response = await fetch('/api/clients/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const json = (await response.json()) as { success: boolean; error?: string };
    setMessage(
      json.success
        ? 'Registration complete. Your invite verified the email address, and you can now sign in from the client portal.'
        : json.error ?? 'Unable to register.'
    );
    if (json.success) {
      setForm({ companyName: '', email: '', contactName: '', phone: '', password: '', inviteCode: '' });
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 pt-20">
      <div className="mx-auto max-w-2xl rounded-3xl border border-cyan-500/20 bg-slate-900/70 p-8">
        <Link className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200" href="/client-onboard">
          ← Back to sign in
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-white">Register invited client</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Invite links expire after 30 days or one use. Use the issued code to verify your email and create your portal credentials.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {Object.entries(form).map(([key, value]) => (
            <input
              key={key}
              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
              placeholder={key}
              type={key === 'password' ? 'password' : 'text'}
              value={value}
              onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
            />
          ))}
        </div>
        <button
          className="mt-5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-white"
          onClick={() => {
            void register();
          }}
          type="button"
        >
          Register
        </button>
        {message ? <p className="mt-4 text-sm text-cyan-200">{message}</p> : null}
      </div>
    </main>
  );
}
