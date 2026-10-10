/**
 * Cryptographic authentication utility using Web Crypto API.
 * The stored hash is the SHA-256 digest of the authorized access credential.
 * The raw plaintext value is NEVER hardcoded in the codebase.
 */

// SHA-256 hash of authorized key
const AUTHORIZED_KEY_SHA256 = '12c1da68fd1ea5d459348134e7908ab2939e7f05ba5a28167f069b84c25e1245';

const AUTH_STORAGE_KEY = 'projectpulse_auth_session_v1';

export async function hashString(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function verifyPasscode(enteredPasscode: string): Promise<boolean> {
  try {
    const computedHash = await hashString(enteredPasscode);
    return computedHash === AUTHORIZED_KEY_SHA256;
  } catch (e) {
    console.error('Crypto verification error', e);
    return false;
  }
}

export function isSessionAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(AUTH_STORAGE_KEY) === 'authenticated';
}

export function setSessionAuthenticated(authenticated: boolean): void {
  if (typeof window === 'undefined') return;
  if (authenticated) {
    localStorage.setItem(AUTH_STORAGE_KEY, 'authenticated');
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}
