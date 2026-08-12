import { NextResponse } from 'next/server';
import { readCodes } from '@/lib/driver-codes';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const codes = readCodes();
    return NextResponse.json({ success: true, data: codes });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to read codes' }, { status: 500 });
  }
}
