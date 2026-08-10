'use client';

import { useState } from 'react';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  dob: '',
  address: '',
  emergencyContact: '',
  vehicleYear: '',
  vehicleMake: '',
  vehicleModel: '',
  vin: '',
  insuranceProvider: '',
  insurancePolicyNumber: '',
  backgroundConsent: true,
};

export default function DriverOnboardPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ id: string; status: string; accessCode: string | null } | null>(null);
  const [message, setMessage] = useState('');

  async function submit() {
    if (!licenseFile || !insuranceFile) {
      setMessage('License and insurance files are required.');
      return;
    }

    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.set(key, String(value)));
    payload.set('licenseFile', licenseFile);
    payload.set('insuranceFile', insuranceFile);

    const response = await fetch('/api/driver-applications', { method: 'POST', body: payload });
    const json = (await response.json()) as { success: boolean; error?: string; data?: { id: string; status: string; accessCode: string | null } };
    if (!json.success || !json.data) {
      setMessage(json.error ?? 'Unable to submit application.');
      return;
    }

    setResult(json.data);
    setMessage('');
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 pt-20 pb-12">
      <div className="mx-auto max-w-4xl rounded-3xl border border-cyan-500/20 bg-slate-900/70 p-8">
        <span className="inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
          Driver onboarding
        </span>
        <h1 className="mt-4 text-3xl font-bold text-white">Apply to drive with Think Easy</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Complete all five steps: personal info, vehicle info, required uploads, and background consent. A confirmation email workflow can be layered on later; this build keeps the verification path internal and trackable.
        </p>

        {result ? (
          <div className="mt-8 rounded-3xl border border-cyan-500/30 bg-cyan-500/10 p-6">
            <h2 className="text-2xl font-bold text-white">Application submitted</h2>
            <p className="mt-3 text-sm text-slate-200">Application ID: {result.id}</p>
            <p className="mt-2 text-sm text-slate-200">Status: {result.status}</p>
            {result.accessCode ? <p className="mt-2 text-sm text-cyan-100">Access code: {result.accessCode}</p> : null}
            <a className="mt-5 inline-flex rounded-full border border-white/20 px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-white" href={`/driver-onboard/status?id=${result.id}&email=${encodeURIComponent(form.email)}`}>
              Check status
            </a>
          </div>
        ) : (
          <>
            <div className="mt-8 flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((current) => (
                <button
                  key={current}
                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] ${step === current ? 'bg-cyan-500 text-slate-950' : 'border border-slate-700 text-slate-300'}`}
                  onClick={() => setStep(current)}
                  type="button"
                >
                  Step {current}
                </button>
              ))}
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {step === 1 && ['name', 'email', 'phone', 'dob', 'address', 'emergencyContact'].map((field) => (
                <input
                  key={field}
                  className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
                  type={field === 'dob' ? 'date' : 'text'}
                  placeholder={field}
                  value={String(form[field as keyof typeof form])}
                  onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}
                />
              ))}
              {step === 2 && ['vehicleYear', 'vehicleMake', 'vehicleModel', 'vin', 'insuranceProvider', 'insurancePolicyNumber'].map((field) => (
                <input
                  key={field}
                  className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
                  placeholder={field}
                  value={String(form[field as keyof typeof form])}
                  onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}
                />
              ))}
              {step === 3 && (
                <input
                  className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white md:col-span-2"
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(event) => setLicenseFile(event.target.files?.[0] ?? null)}
                />
              )}
              {step === 4 && (
                <input
                  className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white md:col-span-2"
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(event) => setInsuranceFile(event.target.files?.[0] ?? null)}
                />
              )}
              {step === 5 && (
                <label className="flex items-start gap-3 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-sm text-slate-200 md:col-span-2">
                  <input
                    checked={form.backgroundConsent}
                    onChange={(event) => setForm((current) => ({ ...current, backgroundConsent: event.target.checked }))}
                    type="checkbox"
                  />
                  I consent to a background review and confirm that all submitted information is accurate.
                </label>
              )}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {step > 1 ? (
                <button className="rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-slate-200" onClick={() => setStep((current) => current - 1)} type="button">
                  Back
                </button>
              ) : null}
              {step < 5 ? (
                <button className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-white" onClick={() => setStep((current) => current + 1)} type="button">
                  Continue
                </button>
              ) : (
                <button className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-white" onClick={() => { void submit(); }} type="button">
                  Submit application
                </button>
              )}
            </div>
            {message ? <p className="mt-4 text-sm text-rose-200">{message}</p> : null}
          </>
        )}
      </div>
    </main>
  );
}
