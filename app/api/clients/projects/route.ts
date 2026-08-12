import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession } from '@/lib/ops-auth';
import { readCollection } from '@/lib/ops-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { error, session } = await requireApiSession(request, ['client']);
  if (error || !session) return error;

  const projects = readCollection('clientProjects').filter((entry) => entry.clientId === session.sub);
  return NextResponse.json({ success: true, data: projects });
}
