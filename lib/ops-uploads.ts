import fs from 'fs';
import path from 'path';
import { createId } from '@/lib/ops-store';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const PUBLIC_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

const ALLOWED_BY_FOLDER: Record<string, string[]> = {
  'employee-docs': ['image/jpeg', 'image/png', 'application/pdf'],
  'driver-licenses': ['image/jpeg', 'image/png', 'application/pdf'],
  'driver-insurance': ['image/jpeg', 'image/png', 'application/pdf'],
  'design-files': ['image/jpeg', 'image/png', 'application/pdf', 'image/webp', 'application/acad', 'application/octet-stream'],
  'client-assets': ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
};

function ensureUploadDir(folder: string) {
  const targetDir = path.join(PUBLIC_UPLOAD_DIR, folder);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  return targetDir;
}

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-');
}

export async function saveUploadedFile(file: File, folder: keyof typeof ALLOWED_BY_FOLDER) {
  if (!file || file.size === 0) {
    throw new Error('A file is required.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 10MB.');
  }

  if (!ALLOWED_BY_FOLDER[folder].includes(file.type)) {
    throw new Error('Unsupported file type.');
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = `${createId('upload')}-${sanitizeFilename(file.name)}`;
  const dir = ensureUploadDir(folder);
  const fullPath = path.join(dir, safeName);
  fs.writeFileSync(fullPath, bytes);

  return {
    filename: file.name,
    storedFilename: safeName,
    publicPath: `/uploads/${folder}/${safeName}`,
  };
}
