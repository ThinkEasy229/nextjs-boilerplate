import Link from 'next/link';
import { cookies } from 'next/headers';
import LoginCard from '@/components/ops/LoginCard';
import PortalLayout from '@/components/ops/PortalLayout';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/ops-session';
import { readCollection } from '@/lib/ops-store';

export const dynamic = 'force-dynamic';

function money(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export default async function HROperationsPage() {
  const session = await verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);

  if (!session || (session.role !== 'hr-manager' && session.role !== 'hr-recruiter')) {
    return (
      <LoginCard
        title="HR Operations"
        description="Manage employee records, payroll, recruiting, driver approvals, and internal ops activity with JSON-backed persistence."
        roleHint="HR manager or recruiter"
        redirectTo="/hr-operations"
        demoCredentials={[
          { label: 'HR Manager', email: 'hr-manager@thinkeasy.local', password: 'Manager123!' },
          { label: 'HR Recruiter', email: 'hr-recruiter@thinkeasy.local', password: 'Recruit123!' },
        ]}
      />
    );
  }

  const employees = readCollection('employees');
  const payroll = readCollection('payroll');
  const documents = readCollection('documents');
  const driverApplications = readCollection('driverApplications');
  const activity = readCollection('activityLog');
  const pendingDocs = documents.filter((entry) => !entry.archived && !entry.expiryDate).length;
  const activeDrivers = employees.filter((entry) => entry.role.toLowerCase().includes('driver') && entry.status === 'active').length;
  const weeklyPending = payroll
    .filter((entry) => entry.status === 'pending')
    .reduce((sum, entry) => sum + entry.netPay, 0);
  const openApplications = driverApplications.filter((entry) => entry.status === 'pending' || entry.status === 'changes-requested').length;
  const upcomingShifts = employees.flatMap((employee) =>
    employee.shiftAssignments.map((shift) => ({
      employee: employee.name,
      ...shift,
    }))
  );

  return (
    <PortalLayout
      title="HR Operations Portal"
      subtitle="Role-based workforce management for recruiting, employee records, payroll, documents, and driver onboarding approvals."
      links={[
        { href: '/hr-operations/employees', label: 'Employees' },
        { href: '/hr-operations/payroll', label: 'Payroll' },
        { href: '/hr-operations/documents', label: 'Documents' },
        ...(session.role === 'hr-manager' ? [{ href: '/admin/settings', label: 'Admin settings' }] : []),
      ]}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Active drivers', value: String(activeDrivers) },
          { label: 'Pending doc checklist', value: String(pendingDocs) },
          { label: 'Upcoming payroll', value: money(weeklyPending) },
          { label: 'Open applications', value: String(openApplications) },
        ].map((card) => (
          <div key={card.label} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">{card.label}</p>
            <p className="mt-3 text-3xl font-bold text-white">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">Schedule snapshot</p>
              <h2 className="mt-2 text-xl font-bold text-white">Weekly shift planning</h2>
            </div>
            <Link className="text-sm font-semibold text-cyan-300" href="/hr-operations/employees">
              Manage employees →
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {upcomingShifts.length > 0 ? (
              upcomingShifts.slice(0, 6).map((shift) => (
                <div key={shift.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{shift.employee}</p>
                      <p className="text-sm text-slate-400">
                        {shift.date} · {shift.startTime} – {shift.endTime}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-cyan-200">Scheduled {shift.scheduledHours}h</p>
                      <p className="text-slate-400">Actual {shift.actualHours}h · OT {shift.overtimeHours}h</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-sm text-slate-400">
                No shifts assigned yet. Add schedules in the employee roster view.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">Activity</p>
          <h2 className="mt-2 text-xl font-bold text-white">Team activity log</h2>
          <div className="mt-5 space-y-3">
            {activity.length > 0 ? (
              activity.slice(0, 8).map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-sm font-semibold text-white">{entry.action}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {entry.actor} · {entry.target}
                  </p>
                  <p className="mt-2 text-xs text-cyan-200">{new Date(entry.createdAt).toLocaleString()}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-sm text-slate-400">
                Activity will appear here after logins, approvals, exports, and updates.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">Recruiting queue</p>
              <h2 className="mt-2 text-xl font-bold text-white">Driver applications</h2>
            </div>
            <Link className="text-sm font-semibold text-cyan-300" href="/driver-onboard/status">
              Public status lookup →
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {driverApplications.slice(0, 5).map((application) => (
              <div key={application.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{application.name}</p>
                    <p className="text-sm text-slate-400">
                      {application.vehicleYear} {application.vehicleMake} {application.vehicleModel}
                    </p>
                  </div>
                  <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
                    {application.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">Portal actions</p>
              <h2 className="mt-2 text-xl font-bold text-white">Operations shortcuts</h2>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              { href: '/hr-operations/employees', label: 'Add employee or convert approved driver' },
              { href: '/hr-operations/documents', label: 'Upload, archive, and export workforce documents' },
              { href: '/hr-operations/payroll', label: 'Generate payroll batches with platform fees' },
              { href: '/admin/settings', label: 'Invite clients and configure payroll defaults' },
            ].map((action) => (
              <Link
                key={action.href}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm font-semibold text-slate-200 transition hover:border-cyan-500/40 hover:text-cyan-200"
                href={action.href}
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PortalLayout>
  );
}
