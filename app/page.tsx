'use client';

import type { FormEvent, HTMLInputTypeAttribute, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { generateWrapConcept, validateWrapConceptParams } from '@/lib/wrap-concept-client';
import {
  createFallbackConcepts,
  getSalesContact,
  normalizeActionUrl,
  PREMIUM_PACKAGE,
  VEHICLE_LIBRARY,
  type WrapDesignRequest,
} from '@/lib/wrap-designer';

const initialForm: WrapDesignRequest = {
  vehicleType: VEHICLE_LIBRARY[0].id,
  vehicleYear: '',
  vehicleMake: '',
  vehicleModel: '',
  companyName: '',
  contactEmail: '',
  industry: '',
  preferredColors: '',
  designDirection: '',
  tagline: '',
  goals: '',
};

export default function Home() {
  const [form, setForm] = useState<WrapDesignRequest>(initialForm);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [selectedConceptIndex, setSelectedConceptIndex] = useState(0);
  const [result, setResult] = useState<Awaited<ReturnType<typeof generateWrapConcept>> | null>(null);

  const salesContact = getSalesContact(process.env.NEXT_PUBLIC_SALES_EMAIL, process.env.NEXT_PUBLIC_SALES_URL);
  const previewRequest = useMemo<WrapDesignRequest>(
    () => ({
      vehicleType: form.vehicleType,
      vehicleYear: form.vehicleYear || '2024',
      vehicleMake: form.vehicleMake || 'Ford',
      vehicleModel: form.vehicleModel || 'Transit',
      companyName: form.companyName || 'Your Company',
      contactEmail: form.contactEmail || 'brand@example.com',
      industry: form.industry || 'Commercial services',
      preferredColors: form.preferredColors || 'Navy, electric blue, orange',
      designDirection:
        form.designDirection || 'Bold, premium, easy-to-read branding with a modern motion feel',
      tagline: form.tagline || 'Turn traffic into trust',
      goals: form.goals || 'Generate a premium concept that feels ready to purchase immediately.',
    }),
    [form]
  );
  const previewSession = useMemo(
    () => createFallbackConcepts(previewRequest, salesContact.salesEmail, salesContact.salesUrl),
    [previewRequest, salesContact.salesEmail, salesContact.salesUrl]
  );
  const selectedConcept = previewSession.concepts?.[selectedConceptIndex] ?? previewSession.concepts?.[0];
  const selectedVehicle = result?.data.selectedVehicle ?? previewSession.selectedVehicle;
  const vehicleSpecs = result?.data.vehicleSpecs ?? previewSession.vehicleSpecs;
  const creativeDirections = result?.data.creativeDirections ?? previewSession.creativeDirections;
  const displayImageUrl = result?.data.imageUrl ?? selectedConcept?.mockupImage ?? previewSession.imageUrl;
  const activeContact = result?.data.contact ?? previewSession.contact;
  const canGenerate = validateWrapConceptParams(form);
  const checkoutUrl = normalizeActionUrl(process.env.NEXT_PUBLIC_PREMIUM_CHECKOUT_URL);
  const purchaseHref = checkoutUrl ?? activeContact.salesUrl;
  const purchaseLabel = checkoutUrl ? 'Purchase premium concept' : activeContact.salesUrl ? 'Talk with sales to purchase' : 'Checkout unavailable';
  const salesHref = activeContact.salesUrl;
  const missingActionUrls = !checkoutUrl || !salesHref;
  const fallbackMessage = activeContact.salesEmail || activeContact.salesPhone ? 'Need help? Use the backup contact options below.' : 'Checkout and sales links are currently unavailable.';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!validateWrapConceptParams(form)) {
      setError('Please complete every required field before generating premium concepts.');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await generateWrapConcept(form);
      setResult(response);
      setSelectedConceptIndex(0);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'Unable to generate premium wrap concepts right now.'
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white pt-14">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-8 lg:px-10 xl:px-12">
        <div className="grid gap-6 rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/30 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
          <div className="space-y-6">
            <div className="space-y-4">
              <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
                Premium vehicle wrap designer
              </span>
              <div className="space-y-3">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
                  Build a state-of-the-art wrap preview customers can generate in minutes.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
                  Select the exact vehicle style, generate multiple AI-led wrap directions, preview them on a realistic mockup,
                  then either purchase the premium concept session or hand the lead directly to sales.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {PREMIUM_PACKAGE.included.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                  <p className="text-sm leading-6 text-slate-200">{item}</p>
                </div>
              ))}
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">1. Choose a vehicle</h2>
                  <span className="text-sm text-slate-400">{selectedVehicle.startingPrice}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {VEHICLE_LIBRARY.map((vehicle) => {
                    const isSelected = form.vehicleType === vehicle.id;
                    return (
                      <button
                        key={vehicle.id}
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, vehicleType: vehicle.id }))}
                        className={`rounded-2xl border p-4 text-left transition ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-500/10'
                            : 'border-white/10 bg-slate-900/60 hover:border-white/30'
                        }`}
                      >
                        <p className="text-sm font-semibold text-white">{vehicle.label}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{vehicle.category}</p>
                        <p className="mt-3 text-sm leading-6 text-slate-300">{vehicle.description}</p>
                        <p className="mt-3 text-xs text-cyan-200">{vehicle.turnaround}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Field
                  label="Vehicle year"
                  value={form.vehicleYear}
                  placeholder="2024"
                  onChange={(value) => setForm((current) => ({ ...current, vehicleYear: value }))}
                />
                <Field
                  label="Vehicle make"
                  value={form.vehicleMake}
                  placeholder="Ford"
                  onChange={(value) => setForm((current) => ({ ...current, vehicleMake: value }))}
                />
                <Field
                  label="Vehicle model"
                  value={form.vehicleModel}
                  placeholder="Transit"
                  onChange={(value) => setForm((current) => ({ ...current, vehicleModel: value }))}
                />
                <Field
                  label="Company name"
                  value={form.companyName}
                  placeholder="Wrap Lab Pro"
                  onChange={(value) => setForm((current) => ({ ...current, companyName: value }))}
                />
                <Field
                  label="Contact email"
                  type="email"
                  value={form.contactEmail}
                  placeholder="design@yourcompany.com"
                  onChange={(value) => setForm((current) => ({ ...current, contactEmail: value }))}
                />
                <Field
                  label="Industry"
                  value={form.industry}
                  placeholder="Commercial fleet branding"
                  onChange={(value) => setForm((current) => ({ ...current, industry: value }))}
                />
                <Field
                  label="Preferred colors"
                  value={form.preferredColors}
                  placeholder="Navy, electric blue, orange"
                  onChange={(value) => setForm((current) => ({ ...current, preferredColors: value }))}
                />
                <Field
                  label="Tagline"
                  value={form.tagline || ''}
                  placeholder="Turn traffic into trust"
                  onChange={(value) => setForm((current) => ({ ...current, tagline: value }))}
                />
                <Field
                  label="Campaign goal"
                  value={form.goals || ''}
                  placeholder="Generate a premium concept that feels ready to purchase immediately."
                  onChange={(value) => setForm((current) => ({ ...current, goals: value }))}
                />
              </div>

              <TextArea
                label="2. Describe the wrap direction"
                value={form.designDirection}
                placeholder="Bold, premium, easy-to-read branding with a modern motion feel."
                onChange={(value) => setForm((current) => ({ ...current, designDirection: value }))}
              />

              <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{PREMIUM_PACKAGE.priceLabel}</p>
                  <p className="text-sm text-slate-400">{PREMIUM_PACKAGE.turnaround}</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <ActionLink
                    href={salesHref}
                    className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40"
                    fallbackClassName="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-slate-500"
                  >
                    Talk with sales instead
                  </ActionLink>
                  <button
                    type="submit"
                    disabled={!canGenerate || isGenerating}
                    className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
                  >
                    {isGenerating ? 'Generating concepts…' : 'Generate premium concepts'}
                  </button>
                </div>
              </div>
              {error ? <p className="text-sm text-rose-300">{error}</p> : null}
            </form>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950/60 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-cyan-200">
                    {result ? 'OpenAI vehicle wrap render' : 'Real-time preview'}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    {vehicleSpecs.vehicleYear} {vehicleSpecs.vehicleMake} {vehicleSpecs.vehicleModel}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {result
                      ? `Generated wrap concept for ${form.companyName || 'your company'} on a ${selectedVehicle.label.toLowerCase()}.`
                      : selectedConcept?.headline}
                  </p>
                </div>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                  {result ? 'AI image ready' : 'Live preview'}
                </span>
              </div>

              <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-white/10 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={displayImageUrl}
                  alt={`${vehicleSpecs.vehicleYear} ${vehicleSpecs.vehicleMake} ${vehicleSpecs.vehicleModel} wrap preview for ${form.companyName || 'your company'}`}
                  className="h-auto w-full"
                />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Vehicle type</p>
                  <p className="mt-2 text-sm font-medium text-white">{selectedVehicle.label}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Year</p>
                  <p className="mt-2 text-sm font-medium text-white">{vehicleSpecs.vehicleYear}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Make</p>
                  <p className="mt-2 text-sm font-medium text-white">{vehicleSpecs.vehicleMake}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Model</p>
                  <p className="mt-2 text-sm font-medium text-white">{vehicleSpecs.vehicleModel}</p>
                </div>
              </div>

              {result ? (
                <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                  <p className="text-sm font-semibold text-white">Primary direction used for the render</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{creativeDirections[0]}</p>
                </div>
              ) : selectedConcept ? (
                <>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {selectedConcept.palette.map((color) => (
                      <div key={color} className="rounded-2xl border border-white/10 bg-slate-900/70 p-3">
                        <div className="h-8 rounded-xl" style={{ backgroundColor: color }} />
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">{color}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 grid gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                    <div>
                      <p className="text-sm font-semibold text-white">Layout strategy</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{selectedConcept.layout}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Why this sells</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{selectedConcept.rationale}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Premium upsell</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{selectedConcept.premiumFeature}</p>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-slate-900/60 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-400">3. Review the creative directions</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">
                    {result ? 'Three written directions returned by GPT-4' : 'Preview directions built for this brief'}
                  </h3>
                </div>
                {result?.metadata.source ? (
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                    {result.metadata.source}
                  </span>
                ) : null}
              </div>

              <div className="mt-5 grid gap-3">
                {creativeDirections.map((direction, index) => {
                  const isSelected = index === selectedConceptIndex;

                  if (result) {
                    return (
                      <div key={direction} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-base font-semibold text-white">Direction {index + 1}</p>
                          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">GPT-4</span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-300">{direction}</p>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={direction}
                      type="button"
                      onClick={() => setSelectedConceptIndex(index)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        isSelected ? 'border-cyan-400 bg-cyan-400/10' : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-base font-semibold text-white">Direction {index + 1}</p>
                        <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Preview</span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-300">{direction}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-5 md:grid-cols-[1fr_auto_auto] md:items-center">
              <div>
                <p className="text-lg font-semibold text-white">Like the direction?</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">
                  Move straight into the premium design service or route this lead to your sales team for a human-led consult.
                </p>
              </div>
              <ActionLink
                href={purchaseHref}
                className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                fallbackClassName="inline-flex items-center justify-center rounded-full bg-slate-800 px-5 py-3 text-sm font-semibold text-slate-300"
              >
                {purchaseLabel}
              </ActionLink>
              <ActionLink
                href={salesHref}
                className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40"
                fallbackClassName="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-slate-500"
              >
                Contact sales
              </ActionLink>
              {missingActionUrls ? (
                <div className="md:col-span-3">
                  <p className="text-sm text-slate-400">{fallbackMessage}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-300">
                    {activeContact.salesEmail && activeContact.salesMailto ? (
                      <a className="underline decoration-white/20 underline-offset-4" href={activeContact.salesMailto}>
                        Email sales
                      </a>
                    ) : null}
                    {activeContact.salesPhone && activeContact.salesPhoneHref ? (
                      <a className="underline decoration-white/20 underline-offset-4" href={activeContact.salesPhoneHref}>
                        Call {activeContact.salesPhone}
                      </a>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ActionLink({
  href,
  className,
  fallbackClassName,
  children,
}: {
  href: string | null;
  className: string;
  fallbackClassName: string;
  children: ReactNode;
}) {
  if (!href) {
    return (
      <span aria-disabled="true" className={fallbackClassName}>
        {children}
      </span>
    );
  }

  return (
    <a className={className} href={href}>
      {children}
    </a>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: HTMLInputTypeAttribute;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <textarea
        rows={5}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-[1.5rem] border border-white/10 bg-slate-900/70 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
      />
    </label>
  );
}
