import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession } from '@/lib/ops-auth';
import { appendActivity, readCollection, syncDesignProjectStatus, writeCollection } from '@/lib/ops-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { error } = await requireApiSession(request, ['design-team']);
  if (error) return error;

  const { id } = await context.params;
  const project = readCollection('designProjects').find((entry) => entry.id === id);
  if (!project) {
    return NextResponse.json({ success: false, error: 'Project not found.' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: project });
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireApiSession(request, ['design-team']);
  if (error || !session) return error;

  try {
    const { id } = await context.params;
    const body = (await request.json()) as { status?: string; note?: string; externalCompany?: string | null };
    let projects = readCollection('designProjects');
    let project = projects.find((entry) => entry.id === id);
    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found.' }, { status: 404 });
    }

    if (
      body.status === 'pending' ||
      body.status === 'in-progress' ||
      body.status === 'ready-for-print' ||
      body.status === 'delivered'
    ) {
      syncDesignProjectStatus(id, body.status, session.email, body.note);
      projects = readCollection('designProjects');
      project = projects.find((entry) => entry.id === id) ?? project;
    }

    if (typeof body.externalCompany === 'string' || body.externalCompany === null) {
      project.externalCompany = body.externalCompany;
    }
    if (typeof body.note === 'string' && body.note.trim()) {
      project.communicationHistory.unshift({
        id: `comm-${Date.now()}`,
        author: session.email,
        message: body.note.trim(),
        createdAt: new Date().toISOString(),
      });
    }
    project.updatedDate = new Date().toISOString();
    writeCollection('designProjects', projects);
    appendActivity('design.updated', session.email, project.projectTitle);
    return NextResponse.json({ success: true, data: project });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to update design project.' }, { status: 500 });
  }
}
