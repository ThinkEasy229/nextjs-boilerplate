'use client';

import { useEffect, useState } from 'react';
import PortalLayout from '@/components/ops/PortalLayout';
import type { DocumentRecord, EmployeeRecord } from '@/lib/ops-store';

export default function DocumentsPage() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    employeeId: '',
    documentType: 'License',
    expiryDate: '',
    file: null as File | null,
  });

  async function loadData() {
    const [employeesResponse, documentsResponse] = await Promise.all([fetch('/api/employees'), fetch('/api/documents')]);
    const employeesJson = (await employeesResponse.json()) as { data?: EmployeeRecord[] };
    const documentsJson = (await documentsResponse.json()) as { data?: DocumentRecord[] };
    setEmployees(employeesJson.data ?? []);
    setDocuments(documentsJson.data ?? []);
  }

  useEffect(() => {
    let active = true;
    Promise.all([fetch('/api/employees'), fetch('/api/documents')])
      .then(async ([employeesResponse, documentsResponse]) => {
        const employeesJson = (await employeesResponse.json()) as { data?: EmployeeRecord[] };
        const documentsJson = (await documentsResponse.json()) as { data?: DocumentRecord[] };
        if (!active) return;
        setEmployees(employeesJson.data ?? []);
        setDocuments(documentsJson.data ?? []);
      })
      .catch(() => {
        if (active) {
          setMessage('Unable to load documents.');
        }
      });
    return () => {
      active = false;
    };
  }, []);

  async function uploadDocument() {
    if (!form.file) {
      setMessage('Choose a file before uploading.');
      return;
    }

    const payload = new FormData();
    payload.set('employeeId', form.employeeId);
    payload.set('documentType', form.documentType);
    payload.set('expiryDate', form.expiryDate);
    payload.set('file', form.file);

    const response = await fetch('/api/documents/upload', { method: 'POST', body: payload });
    const json = (await response.json()) as { success: boolean; error?: string };
    setMessage(json.success ? 'Document uploaded.' : json.error ?? 'Unable to upload document.');
    if (json.success) {
      setForm({ employeeId: '', documentType: 'License', expiryDate: '', file: null });
      await loadData();
    }
  }

  async function toggleArchive(document: DocumentRecord) {
    await fetch(`/api/documents/${document.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived: !document.archived }),
    });
    await loadData();
  }

  return (
    <PortalLayout
      title="Document management"
      subtitle="Upload and track employee and driver documents, maintain checklist visibility, archive obsolete files, and export bulk document bundles."
      links={[
        { href: '/hr-operations', label: 'Dashboard' },
        { href: '/hr-operations/employees', label: 'Employees' },
        { href: '/hr-operations/payroll', label: 'Payroll' },
      ]}
    >
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">Upload document</p>
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <select
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
            value={form.employeeId}
            onChange={(event) => setForm((current) => ({ ...current, employeeId: event.target.value }))}
          >
            <option value="">Select employee</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
          <input
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
            value={form.documentType}
            onChange={(event) => setForm((current) => ({ ...current, documentType: event.target.value }))}
          />
          <input
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
            type="date"
            value={form.expiryDate}
            onChange={(event) => setForm((current) => ({ ...current, expiryDate: event.target.value }))}
          />
          <input
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={(event) => setForm((current) => ({ ...current, file: event.target.files?.[0] ?? null }))}
          />
        </div>
        <button
          className="mt-5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-white"
          onClick={() => {
            void uploadDocument();
          }}
          type="button"
        >
          Upload
        </button>
        <button
          className="ml-3 inline-flex rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-slate-200"
          onClick={() => {
            window.location.assign('/api/documents/export');
          }}
          type="button"
        >
          Export ZIP
        </button>
        {message ? <p className="mt-4 text-sm text-cyan-200">{message}</p> : null}
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">Checklist</p>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.24em] text-cyan-200">
                <th className="pb-3">Employee</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">File</th>
                <th className="pb-3">Expiry</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.id} className="border-t border-slate-800">
                  <td className="py-4 text-white">{employees.find((employee) => employee.id === document.employeeId)?.name ?? document.employeeId}</td>
                  <td className="py-4 text-slate-300">{document.type}</td>
                  <td className="py-4">
                    <a className="text-cyan-200 underline" href={document.path} rel="noreferrer" target="_blank">
                      {document.filename}
                    </a>
                  </td>
                  <td className="py-4 text-slate-300">{document.expiryDate || '—'}</td>
                  <td className="py-4 text-slate-300">{document.archived ? 'archived' : 'active'}</td>
                  <td className="py-4">
                    <button
                      className="rounded-full border border-slate-700 px-3 py-2 text-xs uppercase tracking-[0.24em] text-slate-200"
                      onClick={() => {
                        void toggleArchive(document);
                      }}
                      type="button"
                    >
                      {document.archived ? 'Restore' : 'Archive'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </PortalLayout>
  );
}
