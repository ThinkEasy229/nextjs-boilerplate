import { NextRequest, NextResponse } from 'next/server';
import { validateDriverCode } from '@/lib/driver-codes';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { code?: unknown };
    const code = typeof body.code === 'string' ? body.code.trim() : '';

    if (!code) {
      return NextResponse.json({ success: false, error: 'code is required' }, { status: 400 });
    }

    const result = validateDriverCode(code);
    if (!result.valid) {
      return NextResponse.json({ success: false, error: result.reason ?? 'Invalid code' }, { status: 401 });
    }

    return NextResponse.json({ success: true, driverName: result.driverName });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to validate code' }, { status: 500 });
  }
}
