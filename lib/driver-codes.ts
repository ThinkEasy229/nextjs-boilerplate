import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const CODES_FILE = path.join(DATA_DIR, 'driver-codes.json');

export interface DriverCode {
  id: string;
  code: string;
  driverName: string;
  driverEmail: string;
  createdAt: string;
  expiresAt: string | null;
  active: boolean;
  usageCount: number;
  lastUsedAt: string | null;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function readCodes(): DriverCode[] {
  ensureDataDir();
  if (!fs.existsSync(CODES_FILE)) {
    fs.writeFileSync(CODES_FILE, '[]', 'utf8');
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(CODES_FILE, 'utf8')) as DriverCode[];
  } catch {
    return [];
  }
}

export function writeCodes(codes: DriverCode[]) {
  ensureDataDir();
  fs.writeFileSync(CODES_FILE, JSON.stringify(codes, null, 2), 'utf8');
}

function generateRandomSuffix(length: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateCode(): string {
  const year = new Date().getFullYear();
  const suffix = generateRandomSuffix(4);
  return `DRV-${year}-${suffix}`;
}

export function createDriverCode(
  driverName: string,
  driverEmail: string,
  expiresAt: string | null
): DriverCode {
  const codes = readCodes();
  const code: DriverCode = {
    id: `dc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    code: generateCode(),
    driverName,
    driverEmail,
    createdAt: new Date().toISOString(),
    expiresAt,
    active: true,
    usageCount: 0,
    lastUsedAt: null,
  };
  codes.push(code);
  writeCodes(codes);
  return code;
}

export function validateDriverCode(
  code: string
): { valid: boolean; driverName?: string; reason?: string } {
  const codes = readCodes();
  // Also accept the legacy hardcoded code for backwards compat
  if (code === 'DRIVER2026') {
    return { valid: true, driverName: 'Driver' };
  }
  const entry = codes.find((c) => c.code === code);
  if (!entry) return { valid: false, reason: 'Code not found' };
  if (!entry.active) return { valid: false, reason: 'Code has been deactivated' };
  if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
    return { valid: false, reason: 'Code has expired' };
  }
  // Record usage
  entry.usageCount += 1;
  entry.lastUsedAt = new Date().toISOString();
  writeCodes(codes);
  return { valid: true, driverName: entry.driverName };
}

export function deactivateCode(id: string): boolean {
  const codes = readCodes();
  const entry = codes.find((c) => c.id === id);
  if (!entry) return false;
  entry.active = false;
  writeCodes(codes);
  return true;
}
