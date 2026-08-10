import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession } from '@/lib/ops-auth';
import { createZip } from '@/lib/ops-archive';
import { readCollection } from '@/lib/ops-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { error } = await requireApiSession(request, ['hr-manager', 'hr-recruiter']);
  if (error) return error;

  const employeeId = request.nextUrl.searchParams.get('employeeId');
  const documents = readCollection('documents').filter((entry) => !employeeId || entry.employeeId === employeeId);
  const entries: { name: string; data: Buffer | string }[] = [
    { name: 'manifest.json', data: JSON.stringify(documents, null, 2) },
  ];

  for (const document of documents) {
    const filePath = path.join(process.cwd(), 'public', document.path.replace(/^\/+/, ''));
    if (fs.existsSync(filePath)) {
      entries.push({ name: `documents/${document.filename}`, data: fs.readFileSync(filePath) });
    }
  }

  const archive = createZip(entries);
  return new NextResponse(archive, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${employeeId ?? 'all'}-documents.zip"`,
    },
  });
}
