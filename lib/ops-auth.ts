import { NextRequest, NextResponse } from 'next/server';
import {
  type ClientAccount,
  type AuthUser,
  type UserRole,
  findClientByEmail,
  findStaffUser,
  verifyPassword,
} from '@/lib/ops-store';
import { createSessionToken, SESSION_COOKIE, type SessionPayload, verifySessionToken } from '@/lib/ops-session';

export { createSessionToken, SESSION_COOKIE, verifySessionToken };

export async function authenticateCredentials(email: string, password: string) {
  const staff = findStaffUser(email);
  if (staff && verifyPassword(password, staff.passwordHash, staff.passwordSalt)) {
    return {
      accountType: 'staff' as const,
      user: staff,
    };
  }

  const client = findClientByEmail(email);
  if (client && verifyPassword(password, client.loginHash, client.passwordSalt)) {
    return {
      accountType: 'client' as const,
      user: client,
    };
  }

  return null;
}

export function buildSessionPayload(account: AuthUser | ClientAccount, accountType: 'staff' | 'client'): Omit<SessionPayload, 'exp'> {
  if (accountType === 'client') {
    const client = account as ClientAccount;
    return {
      sub: client.id,
      email: client.email,
      name: client.contactName,
      role: 'client',
      accountType,
      companyName: client.companyName,
    };
  }

  const user = account as AuthUser;
  return {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    accountType,
  };
}

export async function requireApiSession(request: NextRequest, allowedRoles?: UserRole[]) {
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    return {
      error: NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 }),
      session: null,
    };
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return {
      error: NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 }),
      session,
    };
  }

  return { error: null, session };
}
