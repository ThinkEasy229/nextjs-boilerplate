import Link from 'next/link';
import LogoutButton from '@/components/ops/LogoutButton';

interface PortalLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  links?: { href: string; label: string }[];
}

export default function PortalLayout({ title, subtitle, children, links = [] }: PortalLayoutProps) {
  return (
    <main className="min-h-screen bg-slate-950 pt-16 pb-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-cyan-500/20 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/30">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <Link className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300" href="/">
                  ← Think Easy
                </Link>
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-200">
                  Operations ecosystem
                </span>
              </div>
              <h1 className="mt-4 text-3xl font-bold text-white">{title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{subtitle}</p>
            </div>
            <LogoutButton />
          </div>
          {links.length > 0 ? (
            <nav className="mt-5 flex flex-wrap gap-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-200"
                  href={link.href}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          ) : null}
        </header>
        {children}
      </div>
    </main>
  );
}
