'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Wrap Lab' },
  { href: '/billboard-lab', label: 'Billboard Lab' },
  { href: '/driver-portal', label: 'Driver Portal' },
  { href: '/driver-onboard', label: 'Driver Onboard' },
  { href: '/hr-operations', label: 'HR Ops' },
  { href: '/design-studio', label: 'Design Studio' },
  { href: '/client-onboard', label: 'Client Portal' },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur border-b border-cyan-900/40">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <span className="text-cyan-400 font-bold tracking-widest text-sm uppercase">Think Easy Agency</span>
        <div className="flex gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded text-xs font-semibold tracking-wide transition-colors ${
                pathname === l.href
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
