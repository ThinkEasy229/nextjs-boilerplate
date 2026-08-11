'use client';

import { useState } from 'react';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  dob: '',
  address: '',
  vehicleYear: '',
  vehicleMake: '',
  vehicleModel: '',
  vin: '',
  insuranceProvider: '',
  insurancePolicyNumber: '',
  backgroundConsent: true,
};

const stepOneFields = ['name', 'email', 'phone', 'dob', 'address'] as const;
const stepTwoFields = ['vehicleYear', 'vehicleMake', 'vehicleModel', 'vin', 'insuranceProvider', 'insurancePolicyNumber'] as const;

const fieldLabels: Record<(typeof stepOneFields)[number] | (typeof stepTwoFields)[number], string> = {
  name: 'Full name',
  email: 'Email',
  phone: 'Phone',
  dob: 'Date of birth',
  address: 'Address',
  vehicleYear: 'Vehicle year',
  vehicleMake: 'Vehicle make',
  vehicleModel: 'Vehicle model',
  vin: 'VIN',
  insuranceProvider: 'Insurance provider',
  insurancePolicyNumber: 'Insurance policy number',
};

type StepErrorKey = keyof typeof initialForm | 'licenseFile' | 'licenseBackFile' | 'insuranceFile';

export default function DriverOnboardPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licenseBackFile, setLicenseBackFile] = useState<File | null>(null);
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ id: string; status: string; accessCode: string | null } | null>(null);
  const [message, setMessage] = useState('');
  const [stepErrors, setStepErrors] = useState<Partial<Record<StepErrorKey, string>>>({});

  function validateUntilStep(targetStep: number) {
    const errors: Partial<Record<StepErrorKey, string>> = {};

    if (targetStep >= 2) {
      stepOneFields.forEach((field) => {
        if (!String(form[field]).trim()) {
          errors[field] = `${fieldLabels[field]} is required.`;
        }
      });
    }

    if (targetStep >= 3) {
      stepTwoFields.forEach((field) => {
        if (!String(form[field]).trim()) {
          errors[field] = `${fieldLabels[field]} is required.`;
        }
      });
    }

    if (targetStep >= 4) {
      if (!licenseFile) {
        errors.licenseFile = 'Driver license front upload is required.';
      }
      if (!licenseBackFile) {
        errors.licenseBackFile = 'Driver license back upload is required.';
      }
    }

    if (targetStep >= 5 && !insuranceFile) {
      errors.insuranceFile = 'Insurance card upload is required.';
    }

    if (targetStep >= 6 && !form.backgroundConsent) {
      errors.backgroundConsent = 'Background consent is required.';
    }

    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function continueToStep(targetStep: number) {
    if (targetStep <= step) {
      setStep(targetStep);
      return;
    }

    if (!validateUntilStep(targetStep)) {
      setMessage('Please complete all required fields before continuing.');
      return;
    }

    setMessage('');
    setStep(targetStep);
  }

  async function submit() {
    if (!validateUntilStep(6) || !licenseFile || !licenseBackFile || !insuranceFile) {
      setMessage('Please complete all required steps before submitting.');
      return;
    }

    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.set(key, String(value)));
    payload.set('licenseFile', licenseFile);
    payload.set('licenseBackFile', licenseBackFile);
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
                  onClick={() => continueToStep(current)}
                  type="button"
                >
                  Step {current}
                </button>
              ))}
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {step === 1 &&
                stepOneFields.map((field) => (
                  <label key={field} className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">{fieldLabels[field]}</span>
                    <input
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
                      type={field === 'dob' ? 'date' : 'text'}
                      value={String(form[field])}
                      onChange={(event) => {
                        setForm((current) => ({ ...current, [field]: event.target.value }));
                        setStepErrors((current) => ({ ...current, [field]: undefined }));
                      }}
                    />
                    {stepErrors[field] ? <p className="mt-2 text-xs text-rose-300">{stepErrors[field]}</p> : null}
                  </label>
                ))}
              {step === 2 &&
                stepTwoFields.map((field) => (
                  <label key={field} className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">{fieldLabels[field]}</span>
                    <input
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
                      value={String(form[field])}
                      onChange={(event) => {
                        setForm((current) => ({ ...current, [field]: event.target.value }));
                        setStepErrors((current) => ({ ...current, [field]: undefined }));
                      }}
                    />
                    {stepErrors[field] ? <p className="mt-2 text-xs text-rose-300">{stepErrors[field]}</p> : null}
                  </label>
                ))}
              {step === 3 && (
                <div className="grid gap-4 md:col-span-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                      Current state-issued driver&apos;s license (front)
                    </span>
                    <input
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(event) => {
                        setLicenseFile(event.target.files?.[0] ?? null);
                        setStepErrors((current) => ({ ...current, licenseFile: undefined }));
                      }}
                    />
                    {stepErrors.licenseFile ? <p className="mt-2 text-xs text-rose-300">{stepErrors.licenseFile}</p> : null}
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                      Current state-issued driver&apos;s license (back)
                    </span>
                    <input
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(event) => {
                        setLicenseBackFile(event.target.files?.[0] ?? null);
                        setStepErrors((current) => ({ ...current, licenseBackFile: undefined }));
                      }}
                    />
                    {stepErrors.licenseBackFile ? <p className="mt-2 text-xs text-rose-300">{stepErrors.licenseBackFile}</p> : null}
                  </label>
                </div>
              )}
              {step === 4 && (
                <label className="block md:col-span-2">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                    Current valid insurance card
                  </span>
                  <input
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(event) => {
                      setInsuranceFile(event.target.files?.[0] ?? null);
                      setStepErrors((current) => ({ ...current, insuranceFile: undefined }));
                    }}
                  />
                  {stepErrors.insuranceFile ? <p className="mt-2 text-xs text-rose-300">{stepErrors.insuranceFile}</p> : null}
                </label>
              )}
              {step === 5 && (
                <div className="md:col-span-2">
                  <label className="flex items-start gap-3 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-sm text-slate-200">
                    <input
                      checked={form.backgroundConsent}
                      onChange={(event) => {
                        setForm((current) => ({ ...current, backgroundConsent: event.target.checked }));
                        setStepErrors((current) => ({ ...current, backgroundConsent: undefined }));
                      }}
                      type="checkbox"
                    />
                    I consent to a background review and confirm that all submitted information is accurate.
                  </label>
                  {stepErrors.backgroundConsent ? <p className="mt-2 text-xs text-rose-300">{stepErrors.backgroundConsent}</p> : null}
                </div>
              )}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {step > 1 ? (
                <button className="rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-slate-200" onClick={() => setStep((current) => current - 1)} type="button">
                  Back
                </button>
              ) : null}
              {step < 5 ? (
                <button className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-white" onClick={() => continueToStep(step + 1)} type="button">
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
