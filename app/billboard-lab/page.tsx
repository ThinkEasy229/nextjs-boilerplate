'use client';

import { useState } from 'react';

const SELECT_CLASS =
  'w-full bg-slate-800 border border-cyan-900/60 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/60 focus:border-cyan-500/60 transition';
const INPUT_CLASS =
  'w-full bg-slate-800 border border-cyan-900/60 text-white rounded-lg px-3 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/60 focus:border-cyan-500/60 transition';
const LABEL_CLASS = 'block text-xs font-semibold text-cyan-300 uppercase tracking-widest mb-1.5';

type Field = {
  id: string;
  label: string;
  type: 'select' | 'text' | 'textarea';
  placeholder?: string;
  options?: string[];
};

const fields: Field[] = [
  {
    id: 'formatType',
    label: 'Format Type',
    type: 'select',
    options: ['Billboard', 'Digital Billboard', 'Mobile Billboard', 'Billboard Hybrid'],
  },
  {
    id: 'campaignDuration',
    label: 'Campaign Duration',
    type: 'select',
    options: ['2 Weeks', '4 Weeks', '8 Weeks', '12 Weeks'],
  },
  {
    id: 'locationRegion',
    label: 'Location Region',
    type: 'select',
    options: ['Urban', 'Suburban', 'Highway', 'Multi-Market'],
  },
  {
    id: 'industry',
    label: 'Industry',
    type: 'select',
    options: ['Auto', 'Tech', 'Retail', 'Finance', 'Real Estate', 'Healthcare', 'Other'],
  },
  {
    id: 'budgetTier',
    label: 'Budget Tier',
    type: 'select',
    options: ['$5K', '$10K', '$25K', '$50K', 'Custom'],
  },
  {
    id: 'targetAudience',
    label: 'Target Audience',
    type: 'select',
    options: ['B2B', 'B2C', 'Mixed'],
  },
  { id: 'campaignTitle', label: 'Campaign Title', type: 'text', placeholder: 'e.g. Summer Drive 2026' },
  {
    id: 'targetDemographic',
    label: 'Target Demographic',
    type: 'text',
    placeholder: 'e.g. Adults 25-54 in metro areas',
  },
  { id: 'keyMessage', label: 'Key Message', type: 'text', placeholder: 'e.g. Drive more. Pay less.' },
  {
    id: 'campaignBrief',
    label: 'Campaign Brief',
    type: 'textarea',
    placeholder: 'Describe your campaign goals, tone, visual direction, and any special considerations…',
  },
];

type FormState = Record<string, string>;

const initialForm: FormState = Object.fromEntries(fields.map((f) => [f.id, '']));

type ResultData = {
  imageUrl?: string;
  headline?: string;
  bodyCopy?: string;
  callToAction?: string;
  conceptOne?: string;
  conceptTwo?: string;
  conceptThree?: string;
};

export default function BillboardLabPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);

  function handleChange(id: string, value: string) {
    setForm((prev) => ({ ...prev, [id]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch('/api/billboard-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json() as { success: boolean; data?: ResultData; error?: string };
      if (!json.success || !json.data) {
        setError(json.error ?? 'Generation failed. Please try again.');
      } else {
        setResult(json.data);
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen pt-20 pb-16 px-4 bg-slate-950">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <span className="inline-block bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            Billboard Lab
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
            Billboard Campaign Builder
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Configure your campaign parameters and generate AI-powered billboard concepts in seconds.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-slate-900 border border-cyan-900/40 rounded-2xl p-6 sm:p-8 space-y-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {fields.map((f) => {
              if (f.type === 'select') {
                return (
                  <div key={f.id}>
                    <label className={LABEL_CLASS} htmlFor={f.id}>
                      {f.label}
                    </label>
                    <select
                      id={f.id}
                      className={SELECT_CLASS}
                      value={form[f.id]}
                      onChange={(e) => handleChange(f.id, e.target.value)}
                      required
                    >
                      <option value="">Select {f.label}…</option>
                      {f.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }
              if (f.type === 'textarea') {
                return (
                  <div key={f.id} className="sm:col-span-2">
                    <label className={LABEL_CLASS} htmlFor={f.id}>
                      {f.label}
                    </label>
                    <textarea
                      id={f.id}
                      className={INPUT_CLASS + ' min-h-[100px] resize-y'}
                      value={form[f.id]}
                      onChange={(e) => handleChange(f.id, e.target.value)}
                      placeholder={f.placeholder}
                      required
                    />
                  </div>
                );
              }
              return (
                <div key={f.id}>
                  <label className={LABEL_CLASS} htmlFor={f.id}>
                    {f.label}
                  </label>
                  <input
                    id={f.id}
                    type="text"
                    className={INPUT_CLASS}
                    value={form[f.id]}
                    onChange={(e) => handleChange(f.id, e.target.value)}
                    placeholder={f.placeholder}
                    required
                  />
                </div>
              );
            })}
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500/40 rounded-lg px-4 py-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm uppercase tracking-widest shadow-lg hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Generating…' : 'Generate Billboard Concept'}
          </button>
        </form>

        {/* Loading */}
        {loading && (
          <div className="mt-8 flex flex-col items-center gap-3 text-cyan-400">
            <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
            <p className="text-sm">Crafting your billboard concept…</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="mt-8 space-y-6">
            {result.imageUrl && (
              <div className="rounded-2xl overflow-hidden border border-cyan-900/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={result.imageUrl} alt="Billboard concept preview" className="w-full" />
              </div>
            )}
            <div className="bg-slate-900 border border-cyan-900/40 rounded-2xl p-6 space-y-4">
              {result.headline && (
                <div>
                  <p className="text-xs text-cyan-400 uppercase tracking-widest font-bold mb-1">Headline</p>
                  <p className="text-white text-lg font-bold">{result.headline}</p>
                </div>
              )}
              {result.bodyCopy && (
                <div>
                  <p className="text-xs text-cyan-400 uppercase tracking-widest font-bold mb-1">Body Copy</p>
                  <p className="text-slate-300">{result.bodyCopy}</p>
                </div>
              )}
              {result.callToAction && (
                <div>
                  <p className="text-xs text-cyan-400 uppercase tracking-widest font-bold mb-1">Call to Action</p>
                  <p className="text-white font-semibold">{result.callToAction}</p>
                </div>
              )}
              {[result.conceptOne, result.conceptTwo, result.conceptThree].filter(Boolean).map((c, i) => (
                <div key={i} className="bg-slate-800/60 rounded-lg p-4">
                  <p className="text-xs text-cyan-400 uppercase tracking-widest font-bold mb-1">
                    Creative Direction {i + 1}
                  </p>
                  <p className="text-slate-300 text-sm">{c}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
