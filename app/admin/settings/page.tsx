'use client';

import { useEffect, useState } from 'react';
import PortalLayout from '@/components/ops/PortalLayout';
import type { ClientInvite, SystemSettings } from '@/lib/ops-store';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [invites, setInvites] = useState<ClientInvite[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [message, setMessage] = useState('');

  async function loadData() {
    const [settingsResponse, invitesResponse] = await Promise.all([fetch('/api/settings'), fetch('/api/client-invites')]);
    const settingsJson = (await settingsResponse.json()) as { data?: SystemSettings };
    const invitesJson = (await invitesResponse.json()) as { data?: ClientInvite[] };
    setSettings(settingsJson.data ?? null);
    setInvites(invitesJson.data ?? []);
  }

  useEffect(() => {
    let active = true;
    Promise.all([fetch('/api/settings'), fetch('/api/client-invites')])
      .then(async ([settingsResponse, invitesResponse]) => {
        const settingsJson = (await settingsResponse.json()) as { data?: SystemSettings };
        const invitesJson = (await invitesResponse.json()) as { data?: ClientInvite[] };
        if (!active) return;
        setSettings(settingsJson.data ?? null);
        setInvites(invitesJson.data ?? []);
      })
      .catch(() => {
        if (active) {
          setMessage('Unable to load admin data.');
        }
      });
    return () => {
      active = false;
    };
  }, []);

  async function saveSettings() {
    const response = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    const json = (await response.json()) as { success: boolean; error?: string };
    setMessage(json.success ? 'Settings saved.' : json.error ?? 'Unable to save settings.');
    if (json.success) {
      await loadData();
    }
  }

  async function createInvite() {
    const response = await fetch('/api/client-invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail }),
    });
    const json = (await response.json()) as { success: boolean; error?: string };
    setMessage(json.success ? 'Invite created.' : json.error ?? 'Unable to create invite.');
    if (json.success) {
      setInviteEmail('');
      await loadData();
    }
  }

  return (
    <PortalLayout
      title="Admin settings"
      subtitle="Configure the platform fee, auto-approval behavior, required document types, and client invitation flow for the operations ecosystem."
      links={[
        { href: '/hr-operations', label: 'Dashboard' },
        { href: '/client-onboard/register', label: 'Client registration' },
      ]}
    >
      {settings ? (
        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">System configuration</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <input className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white" type="number" value={settings.platformFeePercent} onChange={(event) => setSettings((current) => current ? { ...current, platformFeePercent: Number(event.target.value) } : current)} />
            <input className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white" value={settings.requiredDocumentTypes.join(', ')} onChange={(event) => setSettings((current) => current ? { ...current, requiredDocumentTypes: event.target.value.split(',').map((value) => value.trim()).filter(Boolean) } : current)} />
            <label className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200">
              <input checked={settings.clientProjectAutoApprove} onChange={(event) => setSettings((current) => current ? { ...current, clientProjectAutoApprove: event.target.checked } : current)} type="checkbox" />
              Auto-approve client projects into review
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200">
              <input checked={settings.driverApplicationAutoApprove} onChange={(event) => setSettings((current) => current ? { ...current, driverApplicationAutoApprove: event.target.checked } : current)} type="checkbox" />
              Auto-approve driver applications
            </label>
          </div>
          <button className="mt-5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-white" onClick={() => { void saveSettings(); }} type="button">
            Save settings
          </button>
          {message ? <p className="mt-4 text-sm text-cyan-200">{message}</p> : null}
        </section>
      ) : null}

      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">Client invites</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <input className="min-w-[280px] flex-1 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white" placeholder="client@example.com" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} />
          <button className="rounded-full border border-cyan-500/40 px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200" onClick={() => { void createInvite(); }} type="button">
            Generate invite
          </button>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.24em] text-cyan-200">
                <th className="pb-3">Email</th>
                <th className="pb-3">Code</th>
                <th className="pb-3">Expires</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((invite) => (
                <tr key={invite.id} className="border-t border-slate-800">
                  <td className="py-4 text-white">{invite.email}</td>
                  <td className="py-4 text-cyan-200">{invite.inviteCode}</td>
                  <td className="py-4 text-slate-300">{new Date(invite.expiryDate).toLocaleDateString()}</td>
                  <td className="py-4 text-slate-300">{invite.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </PortalLayout>
  );
}
