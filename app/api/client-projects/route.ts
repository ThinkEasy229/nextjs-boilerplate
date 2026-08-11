import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession } from '@/lib/ops-auth';
import { appendActivity, createClientProjectFromSubmission, readCollection } from '@/lib/ops-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const { error, session } = await requireApiSession(request, ['client']);
  if (error || !session) return error;

  try {
    const body = (await request.json()) as {
      companyName?: string;
      projectTitle?: string;
      vehicleType?: string;
      industry?: string;
      brandingLogo?: string | null;
      colorPaletteImage?: string | null;
      tagline?: string;
      additionalNotes?: string;
    };

    if (!body.companyName || !body.projectTitle || !body.vehicleType || !body.industry) {
      return NextResponse.json({ success: false, error: 'Missing required project fields.' }, { status: 400 });
    }

    const settings = readCollection('settings');
    const result = createClientProjectFromSubmission({
      clientId: session.sub,
      companyName: body.companyName,
      projectTitle: body.projectTitle,
      vehicleType: body.vehicleType,
      industry: body.industry,
      brandingLogo: body.brandingLogo ?? null,
      colorPaletteImage: body.colorPaletteImage ?? null,
      tagline: body.tagline ?? '',
      additionalNotes: body.additionalNotes ?? '',
      autoApprove: settings.clientProjectAutoApprove,
    });
    appendActivity('client.project.created', session.email, body.projectTitle);
    return NextResponse.json({ success: true, data: result.clientProject }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to create client project.' }, { status: 500 });
  }
}
