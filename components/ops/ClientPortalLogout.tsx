'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ClientPortalLogout() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch('/api/client-portal/access', { method: 'DELETE' });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="self-start rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-200 disabled:opacity-50"
    >
      {loading ? 'Signing out…' : 'Sign Out'}
    </button>
  );
}
