import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, type SessionRole, verifySessionToken } from '@/lib/ops-session';

const PUBLIC_PATHS = new Set([
  '/hr-operations',
  '/design-studio',
  '/client-onboard',
  '/client-onboard/register',
  '/driver-onboard',
  '/driver-onboard/status',
  '/wrap-lab',
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

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const allowedRoles = getAllowedRoles(pathname);

  if (!allowedRoles || PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    const redirectUrl = new URL('/client-onboard', request.url);
    if (pathname.startsWith('/hr-operations') || pathname.startsWith('/admin/settings') || pathname.startsWith('/admin/driver-codes')) {
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

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/hr-operations/:path*',
    '/design-studio/:path*',
    '/client-onboard/:path*',
    '/admin/driver-codes/:path*',
    '/admin/settings/:path*',
    '/driver-onboard/:path*',
  ],
};
