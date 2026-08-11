import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession } from '@/lib/ops-auth';
import { appendActivity, readCollection, writeCollection } from '@/lib/ops-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { error } = await requireApiSession(request, ['hr-manager']);
  if (error) return error;

  return NextResponse.json({ success: true, data: readCollection('settings') });
}

export async function PUT(request: NextRequest) {
  const { error, session } = await requireApiSession(request, ['hr-manager']);
  if (error || !session) return error;

  try {
    const body = (await request.json()) as {
      platformFeePercent?: number;
      clientProjectAutoApprove?: boolean;
      driverApplicationAutoApprove?: boolean;
      requiredDocumentTypes?: string[];
    };
    const settings = readCollection('settings');

    settings.platformFeePercent =
      typeof body.platformFeePercent === 'number' ? body.platformFeePercent : settings.platformFeePercent;
    settings.clientProjectAutoApprove =
      typeof body.clientProjectAutoApprove === 'boolean'
        ? body.clientProjectAutoApprove
        : settings.clientProjectAutoApprove;
    settings.driverApplicationAutoApprove =
      typeof body.driverApplicationAutoApprove === 'boolean'
        ? body.driverApplicationAutoApprove
        : settings.driverApplicationAutoApprove;
    settings.requiredDocumentTypes =
      Array.isArray(body.requiredDocumentTypes) && body.requiredDocumentTypes.length > 0
        ? body.requiredDocumentTypes
        : settings.requiredDocumentTypes;

    writeCollection('settings', settings);
    appendActivity('settings.updated', session.email, 'system settings');
    return NextResponse.json({ success: true, data: settings });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to update settings.' }, { status: 500 });
  }
}
