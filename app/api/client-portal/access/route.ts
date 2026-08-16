import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { CLIENT_PORTAL_COOKIE, buildPortalToken } from '@/lib/client-portal-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COOKIE_TTL_SECONDS = 60 * 60 * 8; // 8 hours

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { code?: unknown };
    const code = typeof body.code === 'string' ? body.code.trim() : '';

    if (!code) {
      return NextResponse.json({ success: false, error: 'Access code is required.' }, { status: 400 });
    }

    const expected = process.env.CLIENT_PORTAL_ACCESS_CODE;
    if (!expected) {
      return NextResponse.json({ success: false, error: 'Portal is not configured.' }, { status: 503 });
    }

    // Timing-safe comparison to resist timing attacks
    const codeBytes = Buffer.from(code);
    const expectedBytes = Buffer.from(expected);
    const codesMatch =
      codeBytes.length === expectedBytes.length && timingSafeEqual(codeBytes, expectedBytes);

    if (!codesMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid access code. Please try again.' },
        { status: 401 }
      );
    }

    const token = buildPortalToken();
    const response = NextResponse.json({ success: true });
    response.cookies.set(CLIENT_PORTAL_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/client-portal',
      maxAge: COOKIE_TTL_SECONDS,
    });
    return response;
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to process request.' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(CLIENT_PORTAL_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/client-portal',
    maxAge: 0,
  });
  return response;
}
