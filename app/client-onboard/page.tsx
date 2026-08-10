import Link from 'next/link';
import { cookies } from 'next/headers';
import LoginCard from '@/components/ops/LoginCard';
import PortalLayout from '@/components/ops/PortalLayout';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/ops-session';

export const dynamic = 'force-dynamic';

export default async function ClientOnboardPage() {
  const session = await verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);

  if (!session || session.role !== 'client') {
    return (
      <LoginCard
        title="Client Onboarding"
        description="Invite-only registration for wrap clients. Register with an issued code, sign in, create projects, and track status from intake through production."
        roleHint="Client access"
        redirectTo="/client-onboard/projects"
        demoCredentials={[]}
        footer={
          <>
            Need to activate a new invite?{' '}
            <Link className="font-semibold text-cyan-200 underline" href="/client-onboard/register">
              Register here
            </Link>
            .
          </>
        }
      />
    );
  }

  return (
    <PortalLayout
      title="Client Onboarding Portal"
      subtitle="Track all invited-client wrap requests, project statuses, and production handoffs from a single self-service dashboard."
      links={[{ href: '/client-onboard/projects', label: 'My projects' }]}
    >
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">Signed in</p>
        <h2 className="mt-2 text-xl font-bold text-white">Welcome back, {session.companyName ?? session.name}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
          Your account is verified and ready to create wrap projects. Use the projects view to submit new requests, review specs, download mockups, and follow each status transition.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-white"
            href="/client-onboard/projects"
          >
            Open projects
          </Link>
          <Link
            className="rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-slate-200"
            href="/client-onboard/register"
          >
            Register another invite
          </Link>
        </div>
      </section>
    </PortalLayout>
  );
}
