'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PortalLayout from '@/components/ops/PortalLayout';
import type { DesignProject } from '@/lib/ops-store';

export default function DesignProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const [project, setProject] = useState<DesignProject | null>(null);
  const [message, setMessage] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);

  async function loadProject() {
    const response = await fetch(`/api/design-projects/${params.id}`);
    const json = (await response.json()) as { data?: DesignProject };
    setProject(json.data ?? null);
  }

  useEffect(() => {
    if (!params.id) return;
    let active = true;
    fetch(`/api/design-projects/${params.id}`)
      .then((response) => response.json() as Promise<{ data?: DesignProject }>)
      .then((json) => {
        if (active) {
          setProject(json.data ?? null);
        }
      })
      .catch(() => {
        if (active) {
          setMessage('Unable to load project.');
        }
      });
    return () => {
      active = false;
    };
  }, [params.id]);

  async function updateStatus(status: string) {
    const response = await fetch(`/api/design-projects/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, note }),
    });
    const json = (await response.json()) as { success: boolean; error?: string };
    setMessage(json.success ? 'Project updated.' : json.error ?? 'Unable to update project.');
    if (json.success) {
      setNote('');
      await loadProject();
    }
  }

  async function uploadFile() {
    if (!file) {
      setMessage('Choose a design file first.');
      return;
    }
    const payload = new FormData();
    payload.set('projectId', params.id);
    payload.set('note', note);
    payload.set('file', file);

    const response = await fetch('/api/design-files/upload', { method: 'POST', body: payload });
    const json = (await response.json()) as { success: boolean; error?: string };
    setMessage(json.success ? 'Design file uploaded.' : json.error ?? 'Unable to upload.');
    if (json.success) {
      setFile(null);
      setNote('');
      await loadProject();
    }
  }

  async function exportPackage() {
    const response = await fetch('/api/design-export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: params.id, externalCompany: project?.externalCompany ?? null }),
    });

    if (!response.ok) {
      setMessage('Unable to export package.');
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${params.id}-production-package.zip`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage('Production package downloaded.');
    await loadProject();
  }

  if (!project) {
    return (
      <PortalLayout
        title="Design project"
        subtitle="Loading project details."
        links={[{ href: '/design-studio', label: 'Back to dashboard' }]}
      >
        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 text-slate-300">Loading…</section>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout
      title={project.projectTitle}
      subtitle="Project detail view with specs, creative notes, versioned file uploads, communication history, and ZIP export for production partners."
      links={[{ href: '/design-studio', label: 'Dashboard' }]}
    >
      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">Vehicle specs</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {Object.entries(project.vehicleSpecs).map(([key, value]) => (
              <div key={key} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{key}</p>
                <p className="mt-2 font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Branding</p>
            <p className="mt-2 font-semibold text-white">{project.clientBranding.companyName}</p>
            <p className="mt-1 text-sm text-slate-300">{project.clientBranding.tagline}</p>
            <p className="mt-1 text-sm text-slate-400">{project.clientBranding.companyInfo}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">Workflow</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {['pending', 'in-progress', 'ready-for-print', 'delivered'].map((status) => (
              <button
                key={status}
                className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200"
                onClick={() => {
                  void updateStatus(status);
                }}
                type="button"
              >
                {status}
              </button>
            ))}
          </div>
          <textarea
            className="mt-5 min-h-28 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
            placeholder="Add revision notes or markup guidance"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <input
            className="mt-4 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
            type="file"
            accept=".jpg,.jpeg,.png,.pdf,.dwg"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-white"
              onClick={() => {
                void uploadFile();
              }}
              type="button"
            >
              Upload file
            </button>
            <button
              className="rounded-full border border-cyan-500/40 px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200"
              onClick={() => {
                void exportPackage();
              }}
              type="button"
            >
              Export ZIP
            </button>
          </div>
          {message ? <p className="mt-4 text-sm text-cyan-200">{message}</p> : null}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">Versioned files</p>
          <div className="mt-5 space-y-3">
            {project.designFiles.length > 0 ? (
              project.designFiles.map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="font-semibold text-white">{entry.filename}</p>
                  <p className="mt-1 text-sm text-slate-400">Version {entry.version}</p>
                  <a className="mt-2 inline-flex text-sm text-cyan-200 underline" href={entry.path} rel="noreferrer" target="_blank">
                    Download
                  </a>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-700 p-6 text-sm text-slate-400">
                No design files uploaded yet.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">Notes & communication</p>
          <div className="mt-5 space-y-3">
            {[...project.designNotes, ...project.communicationHistory].slice(0, 8).map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="font-semibold text-white">{entry.author}</p>
                <p className="mt-2 text-sm text-slate-300">{entry.message}</p>
                <p className="mt-2 text-xs text-cyan-200">{new Date(entry.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PortalLayout>
  );
}
