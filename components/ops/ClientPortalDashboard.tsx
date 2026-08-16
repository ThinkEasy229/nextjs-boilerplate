import ClientPortalLogout from '@/components/ops/ClientPortalLogout';

export default function ClientPortalDashboard() {
  return (
    <main className="min-h-screen bg-slate-950 pt-16 pb-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="rounded-3xl border border-cyan-500/20 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/30">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="inline-block rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-200">
                Think Easy Agency — Client Portal
              </span>
              <h1 className="mt-4 text-2xl font-extrabold text-white sm:text-3xl">
                Welcome to Your Client Portal
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Your dedicated space to review project updates, access deliverables, and stay in sync with the Think Easy Agency team throughout your campaign.
              </p>
            </div>
            <ClientPortalLogout />
          </div>
        </header>

        {/* Content cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="mb-3 text-2xl">📋</div>
            <h2 className="text-base font-bold text-white">Project Overview</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              View current project status, timelines, and milestone progress for your active campaigns.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="mb-3 text-2xl">📁</div>
            <h2 className="text-base font-bold text-white">Deliverables & Assets</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Download approved design files, mockups, and final production-ready assets for your project.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="mb-3 text-2xl">💬</div>
            <h2 className="text-base font-bold text-white">Account Contact</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Reach out to your dedicated Think Easy Agency account representative for questions or updates.
            </p>
          </div>
        </div>

        {/* Announcement */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">Client Access Active</p>
          <h2 className="mt-2 text-xl font-bold text-white">You&apos;re all set</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            This portal is exclusively for Think Easy Agency clients. All content here pertains directly to your client relationship, project status, and deliverables. For support, contact your account representative directly.
          </p>
        </section>
      </div>
    </main>
  );
}
