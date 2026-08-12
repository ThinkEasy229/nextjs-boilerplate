import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession } from '@/lib/ops-auth';
import { saveUploadedFile } from '@/lib/ops-uploads';
import {
  appendActivity,
  createId,
  readCollection,
  upsertEmployeeDocument,
} from '@/lib/ops-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const { error, session } = await requireApiSession(request, ['hr-manager', 'hr-recruiter']);
  if (error || !session) return error;

  try {
    const formData = await request.formData();
    const employeeId = formData.get('employeeId');
    const documentType = formData.get('documentType');
    const expiryDate = formData.get('expiryDate');
    const file = formData.get('file');

    if (typeof employeeId !== 'string' || typeof documentType !== 'string' || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'employeeId, documentType, and file are required.' }, { status: 400 });
    }

    const employee = readCollection('employees').find((entry) => entry.id === employeeId);
    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found.' }, { status: 404 });
    }

    const upload = await saveUploadedFile(file, 'employee-docs');
    const record = {
      id: createId('document'),
      employeeId,
      type: documentType,
      filename: upload.filename,
      uploadDate: new Date().toISOString(),
      expiryDate: typeof expiryDate === 'string' && expiryDate ? expiryDate : null,
      path: upload.publicPath,
      archived: false,
      uploadedBy: session.email,
    };

    upsertEmployeeDocument(record);
    appendActivity('document.uploaded', session.email, `${employee.name}:${documentType}`);
    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unable to upload document.' },
      { status: 500 }
    );
  }
}
