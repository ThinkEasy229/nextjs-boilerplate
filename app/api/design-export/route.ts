import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession } from '@/lib/ops-auth';
import { createSimplePdf, createZip } from '@/lib/ops-archive';
import { appendActivity, createId, readCollection, writeCollection } from '@/lib/ops-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const { error, session } = await requireApiSession(request, ['design-team']);
  if (error || !session) return error;

  try {
    const body = (await request.json()) as { projectId?: string; externalCompany?: string };
    if (!body.projectId) {
      return NextResponse.json({ success: false, error: 'projectId is required.' }, { status: 400 });
    }

    const projects = readCollection('designProjects');
    const project = projects.find((entry) => entry.id === body.projectId);
    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found.' }, { status: 404 });
    }

    const pdf = createSimplePdf(project.projectTitle, [
      `Vehicle: ${project.vehicleSpecs.year} ${project.vehicleSpecs.make} ${project.vehicleSpecs.model}`,
      `Dimensions: ${project.vehicleSpecs.dimensions}`,
      `Material: ${project.vehicleSpecs.material}`,
      `Placement: ${project.vehicleSpecs.placement}`,
      `Brand: ${project.clientBranding.companyName}`,
      `Tagline: ${project.clientBranding.tagline}`,
    ]);

    const entries: { name: string; data: Buffer | string }[] = [
      { name: 'vehicle-specs.pdf', data: pdf },
      {
        name: 'client-requirements.json',
        data: JSON.stringify(
          {
            projectTitle: project.projectTitle,
            vehicleSpecs: project.vehicleSpecs,
            clientBranding: project.clientBranding,
            designNotes: project.designNotes,
          },
          null,
          2
        ),
      },
    ];

    if (project.mockupImage) {
      const mockupPath = path.join(process.cwd(), 'public', project.mockupImage.replace(/^\/+/, ''));
      if (fs.existsSync(mockupPath)) {
        entries.push({ name: `mockups/${path.basename(mockupPath)}`, data: fs.readFileSync(mockupPath) });
      }
    }

    for (const file of project.designFiles) {
      const filePath = path.join(process.cwd(), 'public', file.path.replace(/^\/+/, ''));
      if (fs.existsSync(filePath)) {
        entries.push({ name: `design-files/${file.filename}`, data: fs.readFileSync(filePath) });
      }
    }

    if (body.externalCompany) {
      project.externalCompany = body.externalCompany;
    }

    const filename = `${project.id}-production-package.zip`;
    project.productionPackages.unshift({
      id: createId('package'),
      generatedAt: new Date().toISOString(),
      generatedBy: session.email,
      filename,
    });
    project.updatedDate = new Date().toISOString();
    writeCollection('designProjects', projects);
    appendActivity('design.exported', session.email, project.projectTitle);

    return new NextResponse(createZip(entries), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to export production package.' }, { status: 500 });
  }
}
