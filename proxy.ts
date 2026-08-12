import { clerkMiddleware } from '@clerk/nextjs/server';
import type { NextFetchEvent, NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

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

const publishableKey = getFirstValidClerkValue(
  [process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, process.env.CLERK_PUBLISHABLE_KEY],
  isValidClerkPublishableKey
);
const secretKey = getFirstValidClerkValue([process.env.CLERK_SECRET_KEY], isValidClerkSecretKey);
const clerkProxy = publishableKey && secretKey ? clerkMiddleware({ publishableKey, secretKey }) : null;

export default function proxy(request: NextRequest, event: NextFetchEvent) {
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
