import { timingSafeEqual, randomBytes, createHmac } from 'crypto';

export const CLIENT_PORTAL_COOKIE = 'thinkeasy_client_portal';
const COOKIE_SECRET = process.env.SESSION_SECRET || 'thinkeasy-local-session-secret';
const COOKIE_TTL_SECONDS = 60 * 60 * 8; // 8 hours

/** Build a signed token: "<nonce>.<expiry>.<hmac>" */
export function buildPortalToken(): string {
  const nonce = randomBytes(16).toString('hex');
  const expiry = (Date.now() + COOKIE_TTL_SECONDS * 1000).toString();
  const payload = `${nonce}.${expiry}`;
  const hmac = createHmac('sha256', COOKIE_SECRET).update(payload).digest('base64url');
  return `${payload}.${hmac}`;
}

/** Returns true if the token is well-formed, unexpired, and HMAC-verified. */
export function verifyPortalToken(token: string | undefined | null): boolean {
  if (!token) {
    return false;
  }
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }
  const [nonce, expiry, providedHmac] = parts;
  const payload = `${nonce}.${expiry}`;
  const expectedHmac = createHmac('sha256', COOKIE_SECRET).update(payload).digest('base64url');
  try {
    const a = Buffer.from(providedHmac, 'base64url');
    const b = Buffer.from(expectedHmac, 'base64url');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return false;
    }
  } catch {
    return false;
  }
  if (Number(expiry) < Date.now()) {
    return false;
  }
  return true;
}
