import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession } from '@/lib/ops-auth';
import { readCollection } from '@/lib/ops-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { error } = await requireApiSession(request, ['hr-manager']);
  if (error) return error;

  const payroll = readCollection('payroll');
  if (request.nextUrl.searchParams.get('format') === 'csv') {
    const rows = [
      'employeeId,weekStartDate,hoursWorked,hourlyRate,grossEarnings,platformFee,netPay,status,paymentDate',
      ...payroll.map((entry) =>
        [
          entry.employeeId,
          entry.weekStartDate,
          entry.hoursWorked,
          entry.hourlyRate,
          entry.grossEarnings,
          entry.platformFee,
          entry.netPay,
          entry.status,
          entry.paymentDate ?? '',
        ].join(',')
      ),
    ];
    return new NextResponse(rows.join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="payroll-export.csv"',
      },
    });
  }

  return NextResponse.json({ success: true, data: payroll });
}
