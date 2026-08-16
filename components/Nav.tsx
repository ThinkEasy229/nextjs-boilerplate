'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs';

const links = [
  { href: '/driver-portal', label: 'Driver Portal' },
  { href: '/driver-onboard', label: 'Driver Onboard' },
  { href: '/hr-operations', label: 'HR Ops' },
  { href: '/design-studio', label: 'Design Studio' },
  { href: '/client-portal', label: 'Client Portal' },
];

export default function Nav() {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur border-b border-cyan-900/40">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link className="text-cyan-400 font-bold tracking-widest text-sm uppercase" href="/">
          Think Easy Agency
        </Link>
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
        <div className="flex items-center gap-2">
          {isSignedIn ? (
            <UserButton />
          ) : (
            <>
              <SignInButton mode="modal">
                <button className="px-3 py-1.5 rounded text-xs font-semibold tracking-wide text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="px-3 py-1.5 rounded text-xs font-semibold tracking-wide bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-colors">
                  Sign Up
                </button>
              </SignUpButton>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
