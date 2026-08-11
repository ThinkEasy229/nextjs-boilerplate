'use client';

import { useEffect, useState } from 'react';
import PortalLayout from '@/components/ops/PortalLayout';
import type { ClientProject } from '@/lib/ops-store';

const VEHICLE_OPTIONS = [
  'Cargo Van',
  'Box Truck',
  'Sedan',
  'SUV',
  'Pickup Truck',
  'Transit Bus',
  'Semi Truck',
  'Sprinter Van',
  'Trailer',
];

export default function ClientProjectsPage() {
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    companyName: '',
    projectTitle: '',
    vehicleType: VEHICLE_OPTIONS[0],
    industry: '',
    tagline: '',
    additionalNotes: '',
  });
  const [logo, setLogo] = useState<File | null>(null);
  const [palette, setPalette] = useState<File | null>(null);

  async function loadData() {
    const response = await fetch('/api/clients/projects');
    const json = (await response.json()) as { data?: ClientProject[] };
    setProjects(json.data ?? []);
  }

  useEffect(() => {
    let active = true;
    fetch('/api/clients/projects')
      .then((response) => response.json() as Promise<{ data?: ClientProject[] }>)
      .then((json) => {
        if (active) {
          setProjects(json.data ?? []);
        }
      })
      .catch(() => {
        if (active) {
          setMessage('Unable to load projects.');
        }
      });
    return () => {
      active = false;
    };
  }, []);

  async function uploadAsset(file: File | null) {
    if (!file) return null;
    const payload = new FormData();
    payload.set('file', file);
    const response = await fetch('/api/client-assets/upload', { method: 'POST', body: payload });
    const json = (await response.json()) as { success: boolean; data?: { publicPath: string } };
    return json.success ? json.data?.publicPath ?? null : null;
  }

  async function createProject() {
    const brandingLogo = await uploadAsset(logo);
    const colorPaletteImage = await uploadAsset(palette);
    const response = await fetch('/api/client-projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        brandingLogo,
        colorPaletteImage,
      }),
    });
    const json = (await response.json()) as { success: boolean; error?: string };
    setMessage(json.success ? 'Project submitted. It is now read-only and will move through review and design stages.' : json.error ?? 'Unable to create project.');
    if (json.success) {
      setForm({
        companyName: '',
        projectTitle: '',
        vehicleType: VEHICLE_OPTIONS[0],
        industry: '',
        tagline: '',
        additionalNotes: '',
      });
      setLogo(null);
      setPalette(null);
      await loadData();
    }
  }

  return (
    <PortalLayout
      title="Client projects"
      subtitle="Create invite-only wrap projects, upload branding assets, then monitor the project timeline from review through pickup and completion."
      links={[
        { href: '/client-onboard', label: 'Portal home' },
        { href: '/client-onboard/register', label: 'Register invite' },
      ]}
    >
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">Create project</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <input className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white" placeholder="Company name" value={form.companyName} onChange={(event) => setForm((current) => ({ ...current, companyName: event.target.value }))} />
          <input className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white" placeholder="Project title" value={form.projectTitle} onChange={(event) => setForm((current) => ({ ...current, projectTitle: event.target.value }))} />
          <select className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white" value={form.vehicleType} onChange={(event) => setForm((current) => ({ ...current, vehicleType: event.target.value }))}>
            {VEHICLE_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <input className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white" placeholder="Industry" value={form.industry} onChange={(event) => setForm((current) => ({ ...current, industry: event.target.value }))} />
          <input className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white" placeholder="Tagline" value={form.tagline} onChange={(event) => setForm((current) => ({ ...current, tagline: event.target.value }))} />
          <textarea className="min-h-28 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white" placeholder="Additional notes" value={form.additionalNotes} onChange={(event) => setForm((current) => ({ ...current, additionalNotes: event.target.value }))} />
          <input className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white" type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(event) => setLogo(event.target.files?.[0] ?? null)} />
          <input className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white" type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(event) => setPalette(event.target.files?.[0] ?? null)} />
        </div>
        <button className="mt-5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-white" onClick={() => { void createProject(); }} type="button">
          Submit project
        </button>
        {message ? <p className="mt-4 text-sm text-cyan-200">{message}</p> : null}
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">Project tracking</p>
        <div className="mt-5 space-y-4">
          {projects.map((project) => (
            <div key={project.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{project.projectTitle}</p>
                  <p className="text-sm text-slate-400">{project.vehicleType} · {project.industry}</p>
                </div>
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
                  {project.status}
                </span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Timeline</p>
                  {project.timeline.map((entry) => (
                    <p key={`${entry.status}-${entry.changedAt}`} className="mt-2 text-sm text-slate-300">
                      {entry.status} · {new Date(entry.changedAt).toLocaleString()}
                    </p>
                  ))}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Assets</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-cyan-200">
                    {project.brandingLogo ? <a href={project.brandingLogo} rel="noreferrer" target="_blank">Logo</a> : null}
                    {project.colorPaletteImage ? <a href={project.colorPaletteImage} rel="noreferrer" target="_blank">Palette</a> : null}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </PortalLayout>
  );
}
