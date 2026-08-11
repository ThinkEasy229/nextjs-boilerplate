import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession } from '@/lib/ops-auth';
import {
  appendActivity,
  createId,
  readCollection,
  type PayrollAdjustment,
  type PayrollRecord,
  writeCollection,
} from '@/lib/ops-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const { error, session } = await requireApiSession(request, ['hr-manager']);
  if (error || !session) return error;

  try {
    const body = (await request.json()) as {
      employeeId?: string;
      weekStartDate?: string;
      hoursWorked?: number;
      hourlyRate?: number;
      adjustments?: PayrollAdjustment[];
      paymentDate?: string;
      period?: 'weekly' | 'monthly';
    };

    if (!body.employeeId || !body.weekStartDate || typeof body.hoursWorked !== 'number' || typeof body.hourlyRate !== 'number') {
      return NextResponse.json({ success: false, error: 'employeeId, weekStartDate, hoursWorked, and hourlyRate are required.' }, { status: 400 });
    }

    const settings = readCollection('settings');
    const payroll = readCollection('payroll');
    const baseEarnings = body.hoursWorked * body.hourlyRate;
    const overtimeHours = Math.max(0, body.hoursWorked - 40);
    const adjustments = Array.isArray(body.adjustments) ? body.adjustments : [];
    const adjustmentTotal = adjustments.reduce(
      (sum, adjustment) => sum + (adjustment.type === 'deduction' ? -Math.abs(adjustment.amount) : Math.abs(adjustment.amount)),
      0
    );
    const grossEarnings = Number((baseEarnings + adjustmentTotal).toFixed(2));
    const platformFee = Number((grossEarnings * (settings.platformFeePercent / 100)).toFixed(2));
    const netPay = Number((grossEarnings - platformFee).toFixed(2));

    const record: PayrollRecord = {
      id: createId('payroll'),
      employeeId: body.employeeId,
      weekStartDate: body.weekStartDate,
      hoursWorked: body.hoursWorked,
      hourlyRate: body.hourlyRate,
      grossEarnings,
      platformFee,
      netPay,
      status: 'pending',
      paymentDate: body.paymentDate ?? null,
      period: body.period ?? 'weekly',
      overtimeHours,
      adjustments,
    };

    payroll.unshift(record);
    writeCollection('payroll', payroll);
    appendActivity('payroll.generated', session.email, body.employeeId);
    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to generate payroll.' }, { status: 500 });
  }
}
