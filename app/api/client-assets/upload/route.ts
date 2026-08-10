import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession } from '@/lib/ops-auth';
import { saveUploadedFile } from '@/lib/ops-uploads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const { error } = await requireApiSession(request, ['client']);
  if (error) return error;

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'File is required.' }, { status: 400 });
    }

    const upload = await saveUploadedFile(file, 'client-assets');
    return NextResponse.json({ success: true, data: upload }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unable to upload asset.' },
      { status: 500 }
    );
  }
}
