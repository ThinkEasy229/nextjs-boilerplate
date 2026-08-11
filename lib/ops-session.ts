export const SESSION_COOKIE = 'thinkeasy_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'thinkeasy-local-session-secret';
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;

export type SessionRole = 'hr-manager' | 'hr-recruiter' | 'design-team' | 'client';

export interface SessionPayload {
  sub: string;
  email: string;
  name: string;
  role: SessionRole;
  accountType: 'staff' | 'client';
  companyName?: string;
  exp: number;
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function encodePayload(payload: SessionPayload) {
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
}

function decodePayload(value: string) {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(value))) as SessionPayload;
}

async function getSigningKey() {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function signValue(value: string) {
  const key = await getSigningKey();
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

export async function createSessionToken(payload: Omit<SessionPayload, 'exp'>) {
  const encoded = encodePayload({
    ...payload,
    exp: Date.now() + SESSION_TTL_MS,
  });
  const signature = await signValue(encoded);
  return `${encoded}.${signature}`;
}

export async function verifySessionToken(token: string | undefined | null) {
  if (!token) {
    return null;
  }

  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) {
    return null;
  }

  const key = await getSigningKey();
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    base64UrlToBytes(signature),
    new TextEncoder().encode(encoded)
  );
  if (!valid) {
    return null;
  }

  const payload = decodePayload(encoded);
  if (payload.exp < Date.now()) {
    return null;
  }

  return payload;
}
