'use client';

import { useState, useEffect, type CSSProperties } from 'react';
import Link from 'next/link';

interface DriverCode {
  id: string;
  code: string;
  driverName: string;
  driverEmail: string;
  createdAt: string;
  expiresAt: string | null;
  active: boolean;
  usageCount: number;
  lastUsedAt: string | null;
}

export default function AdminDriverCodesPage() {
  const [codes, setCodes] = useState<DriverCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [driverName, setDriverName] = useState('');
  const [driverEmail, setDriverEmail] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [newCode, setNewCode] = useState<DriverCode | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/driver-codes/list')
      .then((r) => r.json() as Promise<{ success: boolean; data: DriverCode[] }>)
      .then((data) => { if (data.success) setCodes(data.data.reverse()); })
      .catch(() => { /* ignore */ })
      .finally(() => setLoading(false));
  }, []);

  async function handleGenerate() {
    setError('');
    if (!driverName.trim() || !driverEmail.trim()) {
      setError('Driver name and email are required.');
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/driver-codes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverName: driverName.trim(), driverEmail: driverEmail.trim(), expiresAt: expiresAt || null }),
      });
      const data = await res.json() as { success: boolean; data?: DriverCode; error?: string };
      if (data.success && data.data) {
        setNewCode(data.data);
        setDriverName('');
        setDriverEmail('');
        setExpiresAt('');
      } else {
        setError(data.error ?? 'Failed to generate code.');
      }
    } catch {
      setError('Network error.');
    }
    setGenerating(false);
  }

  async function handleDeactivate(id: string) {
    if (!confirm('Deactivate this code?')) return;
    await fetch('/api/driver-codes/deactivate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
  }

  const s: Record<string, CSSProperties> = {
    page: { minHeight: '100vh', background: '#0a0a1a', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif', padding: 0 },
    header: { background: 'rgba(10,10,26,0.95)', borderBottom: '1px solid #00e5ff33', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 12 },
    main: { padding: '28px', maxWidth: 1100, margin: '0 auto' },
    card: { background: '#0d0d1f', border: '1px solid #1e293b', borderRadius: 12, padding: 24, marginBottom: 24 },
    label: { fontSize: 10, color: '#00e5ff', letterSpacing: 2, fontWeight: 700, textTransform: 'uppercase' as const, marginBottom: 8, display: 'block' },
    input: { width: '100%', background: '#0a0a1a', border: '1px solid #1e293b', borderRadius: 6, padding: '9px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const },
    btn: { background: 'linear-gradient(135deg,#ff6600,#ff4400)', border: 'none', borderRadius: 8, padding: '10px 20px', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: 1 },
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: { textAlign: 'left' as const, fontSize: 10, color: '#00e5ff', letterSpacing: 2, textTransform: 'uppercase' as const, padding: '8px 12px', borderBottom: '1px solid #1e293b', fontWeight: 700 },
    td: { padding: '10px 12px', fontSize: 13, borderBottom: '1px solid #0d1526', verticalAlign: 'middle' as const },
  };

  return (
    <div style={s.page}>
      <header style={s.header}>
        <Link href="/" style={{ color: '#00e5ff', textDecoration: 'none', fontSize: 13, opacity: 0.7 }}>← Home</Link>
        <span style={{ color: '#334155' }}>|</span>
        <span style={{ color: '#00e5ff', fontWeight: 800, fontSize: 18, letterSpacing: 2, textTransform: 'uppercase', textShadow: '0 0 15px #00e5ff66' }}>🔐 Driver Code Manager</span>
      </header>

      <div style={s.main}>
        {/* Generate new code */}
        <div style={s.card}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Generate New Access Code</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
            <div>
              <label style={s.label}>Driver Name</label>
              <input style={s.input} value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="John Doe" />
            </div>
            <div>
              <label style={s.label}>Driver Email</label>
              <input style={s.input} type="email" value={driverEmail} onChange={(e) => setDriverEmail(e.target.value)} placeholder="john@example.com" />
            </div>
            <div>
              <label style={s.label}>Expiration Date (optional)</label>
              <input style={s.input} type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
            <button style={s.btn} onClick={handleGenerate} disabled={generating}>
              {generating ? 'Generating...' : '+ Generate'}
            </button>
          </div>
          {error && <div style={{ marginTop: 10, color: '#ff6b6b', fontSize: 13 }}>{error}</div>}
          {newCode && (
            <div style={{ marginTop: 16, background: '#00e5ff0d', border: '1px solid #00e5ff44', borderRadius: 8, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: '#00e5ff', letterSpacing: 2, marginBottom: 4 }}>NEW CODE GENERATED</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: 3, fontFamily: 'monospace' }}>{newCode.code}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Share this with {newCode.driverName} ({newCode.driverEmail})</div>
            </div>
          )}
        </div>

        {/* Code list */}
        <div style={s.card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>All Driver Codes ({codes.length})</div>
            <button onClick={() => { setLoading(true); fetch('/api/driver-codes/list').then((r) => r.json() as Promise<{ success: boolean; data: DriverCode[] }>).then((data) => { if (data.success) setCodes(data.data.reverse()); }).catch(() => { }).finally(() => setLoading(false)); }} style={{ background: 'transparent', border: '1px solid #1e293b', borderRadius: 6, padding: '6px 14px', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>↻ Refresh</button>
          </div>
          {loading ? (
            <div style={{ color: '#64748b', padding: 20, textAlign: 'center' }}>Loading codes…</div>
          ) : codes.length === 0 ? (
            <div style={{ color: '#64748b', padding: 20, textAlign: 'center' }}>No codes generated yet. Create one above!</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Code</th>
                    <th style={s.th}>Driver</th>
                    <th style={s.th}>Email</th>
                    <th style={s.th}>Created</th>
                    <th style={s.th}>Expires</th>
                    <th style={s.th}>Uses</th>
                    <th style={s.th}>Last Used</th>
                    <th style={s.th}>Status</th>
                    <th style={s.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((c) => (
                    <tr key={c.id}>
                      <td style={{ ...s.td, fontFamily: 'monospace', color: '#00e5ff', fontWeight: 700, letterSpacing: 1 }}>{c.code}</td>
                      <td style={s.td}>{c.driverName}</td>
                      <td style={{ ...s.td, color: '#64748b', fontSize: 12 }}>{c.driverEmail}</td>
                      <td style={{ ...s.td, fontSize: 12, color: '#64748b' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td style={{ ...s.td, fontSize: 12, color: c.expiresAt && new Date(c.expiresAt) < new Date() ? '#ff6b6b' : '#64748b' }}>
                        {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ ...s.td, color: c.usageCount > 0 ? '#00e5ff' : '#334155' }}>{c.usageCount}</td>
                      <td style={{ ...s.td, fontSize: 12, color: '#64748b' }}>{c.lastUsedAt ? new Date(c.lastUsedAt).toLocaleDateString() : '—'}</td>
                      <td style={s.td}>
                        <span style={{ background: c.active ? '#00ff8822' : '#ff005522', color: c.active ? '#00ff88' : '#ff6b6b', borderRadius: 4, padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                          {c.active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td style={s.td}>
                        {c.active && (
                          <button
                            onClick={() => handleDeactivate(c.id)}
                            style={{ background: '#ff005518', border: '1px solid #ff005544', color: '#ff6b6b', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}
                          >
                            Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <style>{`* { box-sizing: border-box; } input:focus { border-color: #00e5ff66 !important; outline: none; }`}</style>
    </div>
  );
}
