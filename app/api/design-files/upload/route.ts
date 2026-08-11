import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession } from '@/lib/ops-auth';
import { saveUploadedFile } from '@/lib/ops-uploads';
import {
  appendActivity,
  createId,
  readCollection,
  type DesignFileRecord,
  writeCollection,
} from '@/lib/ops-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const { error, session } = await requireApiSession(request, ['design-team']);
  if (error || !session) return error;

  try {
    const formData = await request.formData();
    const projectId = formData.get('projectId');
    const note = formData.get('note');
    const file = formData.get('file');

    if (typeof projectId !== 'string' || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'projectId and file are required.' }, { status: 400 });
    }

    const upload = await saveUploadedFile(file, 'design-files');
    const designFiles = readCollection('designFiles');
    const projects = readCollection('designProjects');
    const project = projects.find((entry) => entry.id === projectId);
    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found.' }, { status: 404 });
    }

    const existingVersion = project.designFiles.reduce((max, entry) => Math.max(max, entry.version), 0);
    const record: DesignFileRecord = {
      id: createId('design-file'),
      projectId,
      filename: upload.filename,
      path: upload.publicPath,
      uploadDate: new Date().toISOString(),
      version: existingVersion + 1,
      note: typeof note === 'string' ? note : '',
    };

    designFiles.unshift(record);
    project.designFiles.unshift({
      id: record.id,
      filename: record.filename,
      path: record.path,
      uploadDate: record.uploadDate,
      version: record.version,
    });
    project.updatedDate = new Date().toISOString();
    if (record.note) {
      project.designNotes.unshift({
        id: createId('note'),
        author: session.email,
        message: record.note,
        createdAt: record.uploadDate,
      });
    }

    writeCollection('designFiles', designFiles);
    writeCollection('designProjects', projects);
    appendActivity('design.file.uploaded', session.email, project.projectTitle);
    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unable to upload design file.' },
      { status: 500 }
    );
  }
}
