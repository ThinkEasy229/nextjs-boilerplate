import { NextRequest, NextResponse } from 'next/server';
import {
  SESSION_COOKIE,
  authenticateCredentials,
  buildSessionPayload,
  createSessionToken,
} from '@/lib/ops-auth';
import { appendActivity } from '@/lib/ops-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: unknown; password?: unknown };
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required.' }, { status: 400 });
    }

    const account = await authenticateCredentials(email, password);
    if (!account) {
      return NextResponse.json({ success: false, error: 'Invalid credentials.' }, { status: 401 });
    }

    const token = await createSessionToken(buildSessionPayload(account.user, account.accountType));
    const response = NextResponse.json({
      success: true,
      session: buildSessionPayload(account.user, account.accountType),
    });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8,
    });
    appendActivity('login', account.user.email, account.accountType === 'client' ? 'client portal' : account.user.role);
    return response;
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to sign in.' }, { status: 500 });
  }
}
