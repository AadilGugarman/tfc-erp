/**
 * Token Registry — shared in-memory store for the current access token.
 *
 * This tiny module sits between auth.ts and tauri.ts to break the circular
 * dependency while keeping the access token out of localStorage.
 *
 *   auth.ts   → writes here after every login / refresh
 *   tauri.ts  → reads here synchronously before every Tauri command
 *
 * The token is NEVER written to localStorage or any persistent store.
 * It is lost on app restart, which is intentional — the persistent session
 * flow silently fetches a new one via the refresh token on startup.
 */

let _token: string | null = null;
let _expiry: number | null = null;

/** Called by auth.ts after every successful login or token refresh. */
export function setAccessToken(token: string, expiresInSeconds: number): void {
  _token = token;
  _expiry = Date.now() + expiresInSeconds * 1000;
}

/** Called by auth.ts on logout or failed refresh. */
export function clearAccessToken(): void {
  _token = null;
  _expiry = null;
}

/** Returns the current in-memory access token, or null if not set / expired. */
export function getAccessToken(): string | null {
  if (!_token) return null;
  if (_expiry && _expiry < Date.now()) {
    _token = null;
    _expiry = null;
    return null;
  }
  return _token;
}

/** True if a non-expired access token is currently held in memory. */
export function hasValidAccessToken(): boolean {
  return getAccessToken() !== null;
}
