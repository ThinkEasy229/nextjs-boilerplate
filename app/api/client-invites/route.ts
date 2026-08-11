import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { requireApiSession } from '@/lib/ops-auth';
import { appendActivity, createId, readCollection, type ClientInvite, writeCollection } from '@/lib/ops-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function createInviteCode() {
  return randomBytes(4).toString('hex').toUpperCase();
}

export async function GET(request: NextRequest) {
  const { error } = await requireApiSession(request, ['hr-manager']);
  if (error) return error;

  return NextResponse.json({ success: true, data: readCollection('clientInvites') });
}

export async function POST(request: NextRequest) {
  const { error, session } = await requireApiSession(request, ['hr-manager']);
  if (error || !session) return error;

  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim();
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required.' }, { status: 400 });
    }

    const invites = readCollection('clientInvites');
    const invite: ClientInvite = {
      id: createId('invite'),
      email,
      inviteCode: createInviteCode(),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      createdBy: session.email,
      usedDate: null,
    };
    invites.unshift(invite);
    writeCollection('clientInvites', invites);
    appendActivity('client.invited', session.email, email);
    return NextResponse.json({ success: true, data: invite }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to create invite.' }, { status: 500 });
  }
}
