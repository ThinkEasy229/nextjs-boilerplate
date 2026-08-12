import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession } from '@/lib/ops-auth';
import {
  appendActivity,
  createId,
  readCollection,
  type EmployeeRecord,
  writeCollection,
} from '@/lib/ops-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { error } = await requireApiSession(request, ['hr-manager', 'hr-recruiter']);
  if (error) return error;

  return NextResponse.json({ success: true, data: readCollection('employees') });
}

export async function POST(request: NextRequest) {
  const { error, session } = await requireApiSession(request, ['hr-manager', 'hr-recruiter']);
  if (error || !session) return error;

  try {
    const body = (await request.json()) as Partial<EmployeeRecord> & { sourceApplicationId?: string };
    const employees = readCollection('employees');
    const driverApplications = readCollection('driverApplications');

    let nextEmployee: EmployeeRecord | null = null;
    if (body.sourceApplicationId) {
      const application = driverApplications.find((entry) => entry.id === body.sourceApplicationId && entry.status === 'approved');
      if (!application) {
        return NextResponse.json({ success: false, error: 'Approved driver application not found.' }, { status: 404 });
      }

      nextEmployee = {
        id: createId('employee'),
        name: application.name,
        email: application.email,
        phone: application.phone,
        address: application.address,
        dob: application.dob,
        ssn: body.ssn ?? '',
        role: body.role ?? 'Driver',
        status: 'active',
        joinDate: new Date().toISOString(),
        emergencyContact: application.emergencyContact ?? '',
        sourceApplicationId: application.id,
        documents: [],
        shiftAssignments: [],
      };
    } else {
      if (!body.name || !body.email || !body.phone) {
        return NextResponse.json({ success: false, error: 'Name, email, and phone are required.' }, { status: 400 });
      }

      nextEmployee = {
        id: createId('employee'),
        name: body.name,
        email: body.email,
        phone: body.phone,
        address: body.address ?? '',
        dob: body.dob ?? '',
        ssn: body.ssn ?? '',
        role: body.role ?? 'Employee',
        status: body.status ?? 'active',
        joinDate: body.joinDate ?? new Date().toISOString(),
        emergencyContact: body.emergencyContact ?? '',
        documents: [],
        shiftAssignments: body.shiftAssignments ?? [],
      };
    }

    employees.unshift(nextEmployee);
    writeCollection('employees', employees);
    appendActivity('employee.created', session.email, nextEmployee.name);
    return NextResponse.json({ success: true, data: nextEmployee }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to create employee.' }, { status: 500 });
  }
}
