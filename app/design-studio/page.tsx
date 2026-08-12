import Link from 'next/link';
import { cookies } from 'next/headers';
import LoginCard from '@/components/ops/LoginCard';
import PortalLayout from '@/components/ops/PortalLayout';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/ops-session';
import { readCollection } from '@/lib/ops-store';

export const dynamic = 'force-dynamic';

export default async function DesignStudioPage() {
  const session = await verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);

  if (!session || session.role !== 'design-team') {
    return (
      <LoginCard
        title="Design Studio"
        description="Manage wrap projects, upload print-ready design files, track revisions, and export production packages for external installers."
        roleHint="Design team only"
        redirectTo="/design-studio"
        demoCredentials={[{ label: 'Design Lead', email: 'design@thinkeasy.local', password: 'Design123!' }]}
      />
    );
  }

  const projects = readCollection('designProjects');
  const counts = {
    pending: projects.filter((entry) => entry.status === 'pending').length,
    inProgress: projects.filter((entry) => entry.status === 'in-progress').length,
    ready: projects.filter((entry) => entry.status === 'ready-for-print').length,
    delivered: projects.filter((entry) => entry.status === 'delivered').length,
  };

  return (
    <PortalLayout
      title="Design Studio"
      subtitle="Track client wrap work from intake through print handoff with JSON-backed status management, notes, files, and export packaging."
      links={projects.slice(0, 4).map((entry) => ({ href: `/design-studio/project/${entry.id}`, label: entry.projectTitle }))}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Pending', value: counts.pending },
          { label: 'In progress', value: counts.inProgress },
          { label: 'Ready for print', value: counts.ready },
          { label: 'Delivered', value: counts.delivered },
        ].map((card) => (
          <div key={card.label} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">{card.label}</p>
            <p className="mt-3 text-3xl font-bold text-white">{card.value}</p>
          </div>
        ))}
      </section>
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">Project dashboard</p>
            <h2 className="mt-2 text-xl font-bold text-white">Wrap production queue</h2>
          </div>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.24em] text-cyan-200">
                <th className="pb-3">Project</th>
                <th className="pb-3">Vehicle</th>
                <th className="pb-3">Client</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-t border-slate-800">
                  <td className="py-4">
                    <Link className="font-semibold text-white hover:text-cyan-200" href={`/design-studio/project/${project.id}`}>
                      {project.projectTitle}
                    </Link>
                  </td>
                  <td className="py-4 text-slate-300">{project.vehicleType}</td>
                  <td className="py-4 text-slate-300">{project.clientBranding.companyName}</td>
                  <td className="py-4 text-cyan-200">{project.status}</td>
                  <td className="py-4 text-slate-400">{new Date(project.updatedDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </PortalLayout>
  );
}
