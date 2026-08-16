import { clerkMiddleware } from '@clerk/nextjs/server';
import type { NextFetchEvent, NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE, type SessionRole, verifySessionToken } from '@/lib/ops-session';

// ─── Ops / Client-Portal route protection ───────────────────────────────────

const PUBLIC_PATHS = new Set([
  '/hr-operations',
  '/design-studio',
  '/client-onboard',
  '/client-onboard/register',
  '/client-portal',
]);

function getAllowedRoles(pathname: string): readonly SessionRole[] | null {
  if (pathname.startsWith('/admin/settings')) {
    return ['hr-manager'] as const;
  }
  if (pathname.startsWith('/admin/driver-codes')) {
    return ['hr-manager', 'hr-recruiter'] as const;
  }
  if (pathname.startsWith('/hr-operations/payroll')) {
    return ['hr-manager'] as const;
  }
  if (pathname.startsWith('/hr-operations')) {
    return ['hr-manager', 'hr-recruiter'] as const;
  }
  if (pathname.startsWith('/design-studio')) {
    return ['design-team'] as const;
  }
  if (pathname.startsWith('/client-onboard/projects')) {
    return ['client'] as const;
  }
  return null;
}

async function opsGuard(request: NextRequest): Promise<NextResponse | null> {
  const { pathname, search } = request.nextUrl;

  // Client portal uses its own cookie gate; the page renders gate vs. dashboard.
  if (pathname === '/client-portal') {
    return null;
  }

  const allowedRoles = getAllowedRoles(pathname);

  if (!allowedRoles || PUBLIC_PATHS.has(pathname)) {
    return null;
  }

  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    const redirectUrl = new URL('/client-onboard', request.url);
    if (
      pathname.startsWith('/hr-operations') ||
      pathname.startsWith('/admin/settings') ||
      pathname.startsWith('/admin/driver-codes')
    ) {
      redirectUrl.pathname = '/hr-operations';
    } else if (pathname.startsWith('/design-studio')) {
      redirectUrl.pathname = '/design-studio';
    }
    redirectUrl.searchParams.set('redirect', `${pathname}${search}`);
    return NextResponse.redirect(redirectUrl);
  }

  if (!allowedRoles.includes(session.role)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return null;
}

// ─── Clerk env normalisation ─────────────────────────────────────────────────

function normalizeClerkEnv(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  if ((trimmed[0] === '"' || trimmed[0] === "'") && trimmed[0] === trimmed[trimmed.length - 1]) {
    const unwrapped = trimmed.slice(1, -1).trim();
    return normalizeClerkEnv(unwrapped);
  }

  const lowered = trimmed.toLowerCase();

  if (
    lowered === 'undefined' ||
    lowered === 'null' ||
    lowered.includes('replace_with_real_key') ||
    lowered.includes('replace-with-real-key') ||
    lowered.startsWith('your_') ||
    lowered.endsWith('_here')
  ) {
    return undefined;
  }

  return trimmed;
}

function isValidClerkPublishableKey(value: string) {
  if (!/^pk_(test|live)_[^\s]+$/.test(value)) {
    return false;
  }

  const encoded = value.split('_')[2];

  if (!encoded) {
    return false;
  }

  try {
    const decoded = atob(encoded);
    return decoded.endsWith('$') && !decoded.slice(0, -1).includes('$') && decoded.includes('.');
  } catch {
    return false;
  }
}

function isValidClerkSecretKey(value: string) {
  return /^sk_(test|live)_[^\s]+$/.test(value);
}

function getFirstValidClerkValue(
  candidates: Array<string | undefined>,
  validator: (value: string) => boolean
) {
  for (const candidate of candidates) {
    const normalized = normalizeClerkEnv(candidate);

    if (normalized && validator(normalized)) {
      return normalized;
    }
  }

  return undefined;
}

function matchesPathPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function isProtectedAuthPath(pathname: string) {
  return ['/__clerk', '/sign-in', '/sign-up', '/user', '/organization'].some((prefix) =>
    matchesPathPrefix(pathname, prefix)
  );
}

function createAuthUnavailableResponse(request: NextRequest) {
  const headers = new Headers({
    'cache-control': 'no-store',
    'x-clerk-auth-status': 'misconfigured',
  });

  if ((request.headers.get('accept') ?? '').includes('text/html')) {
    headers.set('content-type', 'text/html; charset=utf-8');

    return new NextResponse(
      '<!doctype html><html lang="en"><body><h1>Authentication unavailable</h1><p>Clerk runtime keys are missing or invalid.</p></body></html>',
      {
        status: 503,
        headers,
      }
    );
  }

  return NextResponse.json(
    {
      error: 'Authentication is temporarily unavailable because Clerk runtime keys are missing or invalid.',
    },
    {
      status: 503,
      headers,
    }
  );
}

// ─── Proxy entry point ───────────────────────────────────────────────────────

const publishableKey = getFirstValidClerkValue(
  [process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, process.env.CLERK_PUBLISHABLE_KEY],
  isValidClerkPublishableKey
);
const secretKey = getFirstValidClerkValue([process.env.CLERK_SECRET_KEY], isValidClerkSecretKey);
const clerkProxy = publishableKey && secretKey ? clerkMiddleware({ publishableKey, secretKey }) : null;

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  // Run ops guard first (session/role protection)
  const guardResponse = await opsGuard(request);
  if (guardResponse) {
    return guardResponse;
  }

  if (!clerkProxy) {
    if (isProtectedAuthPath(request.nextUrl.pathname)) {
      return createAuthUnavailableResponse(request);
    }

    return NextResponse.next();
  }

  return clerkProxy(request, event);
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/:path*',
  ],
};
