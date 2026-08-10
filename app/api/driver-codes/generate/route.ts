import { NextRequest, NextResponse } from 'next/server';
import { createDriverCode } from '@/lib/driver-codes';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { driverName?: unknown; driverEmail?: unknown; expiresAt?: unknown };
    const driverName = typeof body.driverName === 'string' ? body.driverName.trim() : '';
    const driverEmail = typeof body.driverEmail === 'string' ? body.driverEmail.trim() : '';
    const expiresAt = typeof body.expiresAt === 'string' && body.expiresAt ? body.expiresAt : null;

    if (!driverName || !driverEmail) {
      return NextResponse.json({ success: false, error: 'driverName and driverEmail are required' }, { status: 400 });
    }

    const code = createDriverCode(driverName, driverEmail, expiresAt);
    return NextResponse.json({ success: true, data: code });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to generate code' }, { status: 500 });
  }
}
