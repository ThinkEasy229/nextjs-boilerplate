import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ status: 'ok' });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
