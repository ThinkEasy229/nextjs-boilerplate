import { NextRequest, NextResponse } from 'next/server';
import { deactivateCode } from '@/lib/driver-codes';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { id?: unknown };
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }
    const ok = deactivateCode(id);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Code not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to deactivate code' }, { status: 500 });
  }
}
