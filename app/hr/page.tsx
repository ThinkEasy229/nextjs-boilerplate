'use client';

import { useState, type CSSProperties } from 'react';
import Link from 'next/link';

// Mock data for demo — in production would come from data files
const MOCK_DRIVERS = [
  { id: '1', name: 'Marcus Williams', email: 'marcus@example.com', code: 'DRV-2026-A3K9', status: 'active', shifts: 24, weeklyEarnings: 842.50, totalEarnings: 7210.00, joinedAt: '2026-01-15' },
  { id: '2', name: 'Sarah Chen', email: 'sarah@example.com', code: 'DRV-2026-B7X2', status: 'active', shifts: 18, weeklyEarnings: 631.75, totalEarnings: 5480.25, joinedAt: '2026-02-10' },
  { id: '3', name: 'DeShawn Harris', email: 'deshawn@example.com', code: 'DRV-2026-C1M4', status: 'inactive', shifts: 11, weeklyEarnings: 0, totalEarnings: 3120.00, joinedAt: '2026-03-05' },
  { id: '4', name: 'Rosa Martinez', email: 'rosa@example.com', code: 'DRV-2026-D9P7', status: 'active', shifts: 31, weeklyEarnings: 1104.00, totalEarnings: 9840.00, joinedAt: '2025-12-20' },
];

const MOCK_APPLICATIONS = [
  { id: 'a1', name: 'Tyler Brooks', email: 'tyler@example.com', phone: '555-0101', vehicle: 'Toyota Camry 2022', appliedAt: '2026-08-08', status: 'pending' },
  { id: 'a2', name: 'Jasmine Lee', email: 'jasmine@example.com', phone: '555-0202', vehicle: 'Honda Accord 2021', appliedAt: '2026-08-09', status: 'pending' },
  { id: 'a3', name: 'Kevin Grant', email: 'kevin@example.com', phone: '555-0303', vehicle: 'Ford Escape 2023', appliedAt: '2026-08-07', status: 'approved' },
];

type TabId = 'overview' | 'drivers' | 'recruitment' | 'payroll' | 'codes';

export default function HRDashboardPage() {
  const [tab, setTab] = useState<TabId>('overview');
  const [applications, setApplications] = useState(MOCK_APPLICATIONS);

  const totalActiveDrivers = MOCK_DRIVERS.filter((d) => d.status === 'active').length;
  const totalWeeklyEarnings = MOCK_DRIVERS.reduce((sum, d) => sum + d.weeklyEarnings, 0);
  const totalActiveShifts = MOCK_DRIVERS.filter((d) => d.status === 'active').reduce((sum, d) => sum + d.shifts, 0);
  const pendingApplications = applications.filter((a) => a.status === 'pending').length;

  const s: Record<string, CSSProperties> = {
    page: { minHeight: '100vh', background: '#0a0a1a', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' },
    header: { background: 'rgba(10,10,26,0.95)', borderBottom: '1px solid #00e5ff33', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 40 },
    main: { padding: '28px', maxWidth: 1200, margin: '0 auto' },
    card: { background: '#0d0d1f', border: '1px solid #1e293b', borderRadius: 12, padding: 24, marginBottom: 24 },
    stat: { background: '#0d0d1f', border: '1px solid #1e293b', borderRadius: 12, padding: '20px 24px', textAlign: 'center' as const },
    label: { fontSize: 10, color: '#00e5ff', letterSpacing: 2, fontWeight: 700, textTransform: 'uppercase' as const, marginBottom: 4, display: 'block' },
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: { textAlign: 'left' as const, fontSize: 10, color: '#00e5ff', letterSpacing: 2, textTransform: 'uppercase' as const, padding: '8px 12px', borderBottom: '1px solid #1e293b', fontWeight: 700 },
    td: { padding: '10px 12px', fontSize: 13, borderBottom: '1px solid #0d1526' },
  };

  const TABS: { id: TabId; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'drivers', label: 'Driver Roster', icon: '🚗' },
    { id: 'recruitment', label: 'Recruitment', icon: '📋' },
    { id: 'payroll', label: 'Payroll', icon: '💰' },
    { id: 'codes', label: 'Access Codes', icon: '🔐' },
  ];

  return (
    <div style={s.page}>
      <header style={s.header}>
        <Link href="/" style={{ color: '#00e5ff', textDecoration: 'none', fontSize: 13, opacity: 0.7 }}>← Home</Link>
        <span style={{ color: '#334155' }}>|</span>
        <span style={{ color: '#00e5ff', fontWeight: 800, fontSize: 18, letterSpacing: 2, textTransform: 'uppercase', textShadow: '0 0 15px #00e5ff66' }}>👔 HR Dashboard</span>
        <span style={{ background: '#ff660022', color: '#ff6600', fontSize: 10, padding: '2px 8px', borderRadius: 4, letterSpacing: 1 }}>ADMIN ONLY</span>
      </header>

      {/* Tab navigation */}
      <div style={{ background: '#0d0d1f', borderBottom: '1px solid #00e5ff22', padding: '0 28px', display: 'flex', gap: 0, overflowX: 'auto' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: tab === t.id ? '2px solid #00e5ff' : '2px solid transparent',
              color: tab === t.id ? '#00e5ff' : '#64748b',
              padding: '14px 20px',
              fontSize: 13,
              fontWeight: tab === t.id ? 700 : 400,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap' as const,
            }}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      <div style={s.main}>

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
              <div style={s.stat}>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#00e5ff' }}>{totalActiveDrivers}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Active Drivers</div>
              </div>
              <div style={s.stat}>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#ff6600' }}>${totalWeeklyEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Weekly Earnings</div>
              </div>
              <div style={s.stat}>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#00ff88' }}>{totalActiveShifts}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Total Shifts (Active)</div>
              </div>
              <div style={s.stat}>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#fbbf24' }}>{pendingApplications}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Pending Applications</div>
              </div>
            </div>

            <div style={s.card}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Quick Actions</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <a href="/admin/driver-codes" style={{ background: '#00e5ff22', border: '1px solid #00e5ff44', color: '#00e5ff', padding: '10px 18px', borderRadius: 8, fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>🔐 Manage Driver Codes</a>
                <button onClick={() => setTab('recruitment')} style={{ background: '#ff660022', border: '1px solid #ff660044', color: '#ff6600', padding: '10px 18px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>📋 Review Applications ({pendingApplications})</button>
                <button onClick={() => setTab('payroll')} style={{ background: '#00ff8822', border: '1px solid #00ff8844', color: '#00ff88', padding: '10px 18px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>💰 View Payroll</button>
              </div>
            </div>

            <div style={s.card}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Top Performing Drivers</div>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Driver</th>
                    <th style={s.th}>Status</th>
                    <th style={s.th}>Shifts</th>
                    <th style={s.th}>Weekly Earnings</th>
                    <th style={s.th}>Total Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_DRIVERS.sort((a, b) => b.weeklyEarnings - a.weeklyEarnings).map((d) => (
                    <tr key={d.id}>
                      <td style={s.td}><div style={{ fontWeight: 600 }}>{d.name}</div><div style={{ fontSize: 11, color: '#64748b' }}>{d.email}</div></td>
                      <td style={s.td}>
                        <span style={{ background: d.status === 'active' ? '#00ff8822' : '#ff005522', color: d.status === 'active' ? '#00ff88' : '#ff6b6b', borderRadius: 4, padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                          {d.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={s.td}>{d.shifts}</td>
                      <td style={{ ...s.td, color: '#00e5ff', fontWeight: 700 }}>${d.weeklyEarnings.toFixed(2)}</td>
                      <td style={{ ...s.td, color: '#94a3b8' }}>${d.totalEarnings.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* DRIVERS TAB */}
        {tab === 'drivers' && (
          <div style={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Driver Roster ({MOCK_DRIVERS.length})</div>
              <a href="/admin/driver-codes" style={{ background: '#00e5ff22', border: '1px solid #00e5ff44', color: '#00e5ff', padding: '8px 16px', borderRadius: 8, fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>+ Add Driver Code</a>
            </div>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Driver</th>
                  <th style={s.th}>Access Code</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Shifts</th>
                  <th style={s.th}>This Week</th>
                  <th style={s.th}>Total Earned</th>
                  <th style={s.th}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_DRIVERS.map((d) => (
                  <tr key={d.id}>
                    <td style={s.td}><div style={{ fontWeight: 600 }}>{d.name}</div><div style={{ fontSize: 11, color: '#64748b' }}>{d.email}</div></td>
                    <td style={{ ...s.td, fontFamily: 'monospace', color: '#00e5ff', fontSize: 12 }}>{d.code}</td>
                    <td style={s.td}>
                      <span style={{ background: d.status === 'active' ? '#00ff8822' : '#ff005522', color: d.status === 'active' ? '#00ff88' : '#ff6b6b', borderRadius: 4, padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                        {d.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={s.td}>{d.shifts}</td>
                    <td style={{ ...s.td, color: d.weeklyEarnings > 0 ? '#00e5ff' : '#334155', fontWeight: 700 }}>${d.weeklyEarnings.toFixed(2)}</td>
                    <td style={{ ...s.td, color: '#94a3b8' }}>${d.totalEarnings.toLocaleString()}</td>
                    <td style={{ ...s.td, fontSize: 12, color: '#64748b' }}>{new Date(d.joinedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* RECRUITMENT TAB */}
        {tab === 'recruitment' && (
          <div style={s.card}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Applications ({applications.length})</div>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Applicant</th>
                  <th style={s.th}>Phone</th>
                  <th style={s.th}>Vehicle</th>
                  <th style={s.th}>Applied</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((a) => (
                  <tr key={a.id}>
                    <td style={s.td}><div style={{ fontWeight: 600 }}>{a.name}</div><div style={{ fontSize: 11, color: '#64748b' }}>{a.email}</div></td>
                    <td style={s.td}>{a.phone}</td>
                    <td style={s.td}>{a.vehicle}</td>
                    <td style={{ ...s.td, fontSize: 12, color: '#64748b' }}>{new Date(a.appliedAt).toLocaleDateString()}</td>
                    <td style={s.td}>
                      <span style={{ background: a.status === 'approved' ? '#00ff8822' : a.status === 'rejected' ? '#ff005522' : '#fbbf2422', color: a.status === 'approved' ? '#00ff88' : a.status === 'rejected' ? '#ff6b6b' : '#fbbf24', borderRadius: 4, padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                        {a.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={s.td}>
                      {a.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => setApplications((prev) => prev.map((x) => x.id === a.id ? { ...x, status: 'approved' } : x))}
                            style={{ background: '#00ff8818', border: '1px solid #00ff8844', color: '#00ff88', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setApplications((prev) => prev.map((x) => x.id === a.id ? { ...x, status: 'rejected' } : x))}
                            style={{ background: '#ff005518', border: '1px solid #ff005544', color: '#ff6b6b', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {a.status === 'approved' && (
                        <a href="/admin/driver-codes" style={{ background: '#00e5ff18', border: '1px solid #00e5ff44', color: '#00e5ff', borderRadius: 4, padding: '4px 10px', fontSize: 11, textDecoration: 'none' }}>
                          Generate Code
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAYROLL TAB */}
        {tab === 'payroll' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
              <div style={s.stat}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#00e5ff' }}>${totalWeeklyEarnings.toFixed(2)}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Total Weekly Payouts</div>
              </div>
              <div style={s.stat}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#ff6600' }}>${(totalWeeklyEarnings * 0.15).toFixed(2)}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Platform Fees (15%)</div>
              </div>
              <div style={s.stat}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#00ff88' }}>${(totalWeeklyEarnings * 0.85).toFixed(2)}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Driver Net Pay</div>
              </div>
            </div>
            <div style={s.card}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Weekly Payroll Breakdown</div>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Driver</th>
                    <th style={s.th}>Shifts</th>
                    <th style={s.th}>Gross Earnings</th>
                    <th style={s.th}>Platform Fee (15%)</th>
                    <th style={s.th}>Net Pay</th>
                    <th style={s.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_DRIVERS.map((d) => (
                    <tr key={d.id}>
                      <td style={s.td}><div style={{ fontWeight: 600 }}>{d.name}</div></td>
                      <td style={s.td}>{d.shifts}</td>
                      <td style={{ ...s.td, color: '#00e5ff', fontWeight: 700 }}>${d.weeklyEarnings.toFixed(2)}</td>
                      <td style={{ ...s.td, color: '#ff6600' }}>${(d.weeklyEarnings * 0.15).toFixed(2)}</td>
                      <td style={{ ...s.td, color: '#00ff88', fontWeight: 700 }}>${(d.weeklyEarnings * 0.85).toFixed(2)}</td>
                      <td style={s.td}>
                        <span style={{ background: d.status === 'active' ? '#00ff8822' : '#ff005522', color: d.status === 'active' ? '#00ff88' : '#ff6b6b', borderRadius: 4, padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                          {d.weeklyEarnings > 0 ? 'DUE' : 'NONE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td style={{ ...s.td, fontWeight: 700, color: '#fff' }} colSpan={2}>TOTAL</td>
                    <td style={{ ...s.td, color: '#00e5ff', fontWeight: 900 }}>${totalWeeklyEarnings.toFixed(2)}</td>
                    <td style={{ ...s.td, color: '#ff6600', fontWeight: 700 }}>${(totalWeeklyEarnings * 0.15).toFixed(2)}</td>
                    <td style={{ ...s.td, color: '#00ff88', fontWeight: 900 }}>${(totalWeeklyEarnings * 0.85).toFixed(2)}</td>
                    <td style={s.td} />
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* CODES TAB */}
        {tab === 'codes' && (
          <div style={s.card}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Driver Access Code Management</div>
            <div style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>Generate, view, and manage all driver access codes. Each code is unique and in the format DRV-YYYY-XXXX.</div>
            <a
              href="/admin/driver-codes"
              style={{ display: 'inline-block', background: 'linear-gradient(135deg,#ff6600,#ff4400)', border: 'none', borderRadius: 8, padding: '12px 24px', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', letterSpacing: 1, boxShadow: '0 0 20px #ff660044' }}
            >
              🔐 Open Code Manager →
            </a>
          </div>
        )}

      </div>
      <style>{`* { box-sizing: border-box; } @media (max-width: 700px) { .hr-stats { grid-template-columns: repeat(2,1fr) !important; } }`}</style>
    </div>
  );
}
