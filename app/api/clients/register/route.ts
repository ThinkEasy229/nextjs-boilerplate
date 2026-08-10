import { NextRequest, NextResponse } from 'next/server';
import {
  appendActivity,
  createId,
  findClientInvite,
  hashPassword,
  readCollection,
  type ClientAccount,
  writeCollection,
} from '@/lib/ops-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      companyName?: string;
      email?: string;
      contactName?: string;
      phone?: string;
      password?: string;
      inviteCode?: string;
    };

    if (!body.companyName || !body.email || !body.contactName || !body.password || !body.inviteCode) {
      return NextResponse.json({ success: false, error: 'All required fields must be provided.' }, { status: 400 });
    }

    const invite = findClientInvite(body.inviteCode);
    if (!invite || invite.email.toLowerCase() !== body.email.toLowerCase()) {
      return NextResponse.json({ success: false, error: 'Invite is invalid or expired.' }, { status: 400 });
    }

    const clients = readCollection('clients');
    if (clients.some((entry) => entry.email.toLowerCase() === body.email!.toLowerCase())) {
      return NextResponse.json({ success: false, error: 'A client account already exists for this email.' }, { status: 409 });
    }

    const password = hashPassword(body.password);
    const client: ClientAccount = {
      id: createId('client'),
      companyName: body.companyName,
      email: body.email,
      contactName: body.contactName,
      phone: body.phone ?? '',
      loginHash: password.hash,
      passwordSalt: password.salt,
      status: 'active',
      inviteDate: new Date().toISOString(),
      projects: [],
      emailVerified: true,
    };
    clients.unshift(client);

    const invites = readCollection('clientInvites');
    const targetInvite = invites.find((entry) => entry.id === invite.id);
    if (targetInvite) {
      targetInvite.status = 'used';
      targetInvite.usedDate = new Date().toISOString();
    }

    writeCollection('clients', clients);
    writeCollection('clientInvites', invites);
    appendActivity('client.registered', client.email, client.companyName);
    return NextResponse.json({ success: true, data: { id: client.id, emailVerified: client.emailVerified } }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to register client.' }, { status: 500 });
  }
}
