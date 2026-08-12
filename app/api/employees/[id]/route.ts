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
    const body = (await request.json()) as Record<string, unknown>;
    const employees = readCollection('employees');
    const employee = employees.find((entry) => entry.id === id);

    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found.' }, { status: 404 });
    }

    employee.name = typeof body.name === 'string' ? body.name : employee.name;
    employee.email = typeof body.email === 'string' ? body.email : employee.email;
    employee.phone = typeof body.phone === 'string' ? body.phone : employee.phone;
    employee.address = typeof body.address === 'string' ? body.address : employee.address;
    employee.dob = typeof body.dob === 'string' ? body.dob : employee.dob;
    employee.ssn = typeof body.ssn === 'string' ? body.ssn : employee.ssn;
    employee.role = typeof body.role === 'string' ? body.role : employee.role;
    employee.status =
      body.status === 'active' || body.status === 'inactive' || body.status === 'on-leave'
        ? body.status
        : employee.status;
    employee.emergencyContact =
      typeof body.emergencyContact === 'string' ? body.emergencyContact : employee.emergencyContact;

    if (Array.isArray(body.shiftAssignments)) {
      employee.shiftAssignments = body.shiftAssignments as typeof employee.shiftAssignments;
    }

    if (Array.isArray(body.documents)) {
      employee.documents = body.documents as typeof employee.documents;
    }

    writeCollection('employees', employees);
    appendActivity('employee.updated', session.email, employee.name);
    return NextResponse.json({ success: true, data: employee });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to update employee.' }, { status: 500 });
  }
}
