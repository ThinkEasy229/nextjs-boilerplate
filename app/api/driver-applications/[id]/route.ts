import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession } from '@/lib/ops-auth';
import { createDriverCode } from '@/lib/driver-codes';
import { appendActivity, readCollection, updateDriverApplicationStatus } from '@/lib/ops-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const email = request.nextUrl.searchParams.get('email');
  const application = readCollection('driverApplications').find(
    (entry) => entry.id === id && (!email || entry.email.toLowerCase() === email.toLowerCase())
  );

  if (!application) {
    return NextResponse.json({ success: false, error: 'Application not found.' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: application });
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireApiSession(request, ['hr-manager']);
  if (error || !session) return error;

  try {
    const { id } = await context.params;
    const body = (await request.json()) as { status?: string; note?: string };
    if (
      body.status !== 'approved' &&
      body.status !== 'rejected' &&
      body.status !== 'changes-requested'
    ) {
      return NextResponse.json({ success: false, error: 'Invalid status.' }, { status: 400 });
    }

    const applications = readCollection('driverApplications');
    const target = applications.find((entry) => entry.id === id);
    if (!target) {
      return NextResponse.json({ success: false, error: 'Application not found.' }, { status: 404 });
    }

    const accessCode =
      body.status === 'approved' && !target.accessCode
        ? createDriverCode(target.name, target.email, null).code
        : target.accessCode;
    const updated = updateDriverApplicationStatus(id, body.status, session.email, body.note ?? '', accessCode ?? null);
    appendActivity(`driver.application.${body.status}`, session.email, target.email);
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to update application.' }, { status: 500 });
  }
}
