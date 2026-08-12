import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession } from '@/lib/ops-auth';
import { appendActivity, readCollection, writeCollection } from '@/lib/ops-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireApiSession(request, ['hr-manager', 'hr-recruiter']);
  if (error || !session) return error;

  try {
    const { id } = await context.params;
    const body = (await request.json()) as { archived?: boolean };
    const documents = readCollection('documents');
    const employees = readCollection('employees');
    const document = documents.find((entry) => entry.id === id);
    if (!document) {
      return NextResponse.json({ success: false, error: 'Document not found.' }, { status: 404 });
    }

    document.archived = typeof body.archived === 'boolean' ? body.archived : document.archived;
    const employee = employees.find((entry) => entry.id === document.employeeId);
    if (employee) {
      employee.documents = employee.documents.map((entry) =>
        entry.id === id ? { ...entry, archived: document.archived } : entry
      );
    }

    writeCollection('documents', documents);
    writeCollection('employees', employees);
    appendActivity('document.updated', session.email, document.filename);
    return NextResponse.json({ success: true, data: document });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to update document.' }, { status: 500 });
  }
}
