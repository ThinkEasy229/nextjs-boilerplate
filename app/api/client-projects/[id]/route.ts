import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession } from '@/lib/ops-auth';
import { readCollection } from '@/lib/ops-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireApiSession(request, ['client']);
  if (error || !session) return error;

  const { id } = await context.params;
  const project = readCollection('clientProjects').find((entry) => entry.id === id && entry.clientId === session.sub);
  if (!project) {
    return NextResponse.json({ success: false, error: 'Project not found.' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: project });
}
