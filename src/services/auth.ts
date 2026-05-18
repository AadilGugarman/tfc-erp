import { secureInvoke } from "@/utils/tauri";
import {
  setAccessToken,
  clearAccessToken,
  getAccessToken,
  hasValidAccessToken,
} from "@/utils/tokenRegistry";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  user_id: string;
  username: string;
  email: string;
  name: string;
  role: string;
  company_ids: string[];
  default_company_id?: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
  companyIds: string[];
  defaultCompanyId?: string;
  is_active: boolean;
}

// ─── Storage keys ─────────────────────────────────────────────────────────────
//
// Security model:
//   ACCESS TOKEN   → tokenRegistry (in-memory only, never written to disk)
//   REFRESH TOKEN  → localStorage  (rotated on every use by the backend)
//   USER / EXPIRY  → localStorage  (non-sensitive session metadata)
//
// "Remember me" keys (UI flags only — no credentials stored):
//   PERSISTENT_SESSION_KEY  → "true" when remember-me is active
//   PERSISTENT_EXPIRY_KEY   → absolute ms timestamp: login + 30 days
//   REMEMBERED_USERNAME_KEY → pre-fills the username field after logout

const REFRESH_TOKEN_KEY = "tfc-erp-refresh-token";
const USER_KEY = "tfc-erp-user";
const TOKEN_EXPIRY_KEY = "tfc-erp-token-expiry";
const CURRENT_COMPANY_ID_KEY = "tfc-erp-current-company-id";
const COMPANY_IDS_KEY = "tfc-erp-company-ids";
const PERSISTENT_SESSION_KEY = "tfc-erp-persistent-session";
const PERSISTENT_EXPIRY_KEY = "tfc-erp-persistent-expiry";
const REMEMBERED_USERNAME_KEY = "tfc-erp-remembered-username";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// ─── AuthService ──────────────────────────────────────────────────────────────

class AuthService {
  private _refreshTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * In-flight refresh promise — deduplicates concurrent refresh calls.
   * If two API calls fire simultaneously when the token is expired, both
   * await the same promise instead of racing to refresh.
   */
  private _refreshPromise: Promise<AuthResponse> | null = null;

  // ── Setup / admin ────────────────────────────────────────────────────────────

  async hasUsers(): Promise<boolean> {
    const { hasUsers } = await this.getSetupStatus();
    return hasUsers;
  }

  async getSetupStatus(): Promise<{ hasUsers: boolean; error?: string }> {
    try {
      const hasUsers = await secureInvoke<boolean>("has_users", undefined, {
        maxAttempts: 50,
        delayMs: 200,
      });
      return { hasUsers };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[AuthService] getSetupStatus failed:", error);
      return { hasUsers: false, error: message };
    }
  }

  async clearUsersForSetup(): Promise<void> {
    await secureInvoke("clear_users_for_setup");
  }

  async setupInitialAdmin(data: {
    username: string;
    password: string;
    name: string;
    email: string;
  }): Promise<AuthResponse> {
    try {
      const response = await secureInvoke<AuthResponse>(
        "setup_initial_admin",
        data,
      );
      this._applyAuthResponse(response);
      this._scheduleTokenRefresh(response.expires_in);
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        message.startsWith("Setup failed:")
          ? message
          : message.replace(/^Command failed:\s*/i, ""),
      );
    }
  }

  // ── Login ────────────────────────────────────────────────────────────────────

  /**
   * Authenticate with username + password.
   *
   * When `rememberMe` is true:
   *   - Writes PERSISTENT_SESSION_KEY = "true"
   *   - Writes PERSISTENT_EXPIRY_KEY  = now + 30 days
   *   - Writes REMEMBERED_USERNAME_KEY = username
   *
   * Passwords are NEVER stored anywhere.
   * Access token is kept in memory only (tokenRegistry).
   */
  async login(
    username: string,
    password: string,
    rememberMe = false,
  ): Promise<AuthResponse> {
    try {
      const response = await secureInvoke<AuthResponse>("login", {
        request: { username, password },
      });

      this._applyAuthResponse(response);
      this._storeAccessibleCompanies(response.company_ids ?? []);

      if (rememberMe) {
        localStorage.setItem(PERSISTENT_SESSION_KEY, "true");
        localStorage.setItem(
          PERSISTENT_EXPIRY_KEY,
          (Date.now() + THIRTY_DAYS_MS).toString(),
        );
        localStorage.setItem(REMEMBERED_USERNAME_KEY, username);
      } else {
        localStorage.removeItem(PERSISTENT_SESSION_KEY);
        localStorage.removeItem(PERSISTENT_EXPIRY_KEY);
      }

      this._scheduleTokenRefresh(response.expires_in);
      return response;
    } catch (error) {
      throw new Error(`Login failed: ${error}`);
    }
  }

  // ── Persistent session restore ───────────────────────────────────────────────

  /**
   * Called once on app startup by `useAuth`.
   *
   * Decision tree:
   *   1. No persistent session flag → return false (show login).
   *   2. 30-day wall passed → clear session, return false.
   *   3. Access token in memory and still valid → return true.
   *   4. Refresh token exists → silent refresh + backend validation → return true.
   *   5. Refresh fails → clear session, return false.
   */
  async tryRestorePersistentSession(): Promise<boolean> {
    if (!this.hasPersistentSession()) return false;

    const expiry = this.getPersistentExpiry();
    if (expiry !== null && Date.now() > expiry) {
      console.info("[AuthService] Persistent session expired (30-day limit).");
      this._clearPersistentSession();
      return false;
    }

    // Access token still valid in memory
    if (this.isAuthenticatedSync()) return true;

    // Try silent refresh (also validates user is still active on the backend)
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this._clearPersistentSession();
      return false;
    }

    try {
      await this.refreshToken();
      console.info(
        "[AuthService] Persistent session restored via token refresh.",
      );
      return true;
    } catch {
      console.warn(
        "[AuthService] Silent token refresh failed — clearing persistent session.",
      );
      this._clearPersistentSession();
      return false;
    }
  }

  hasPersistentSession(): boolean {
    return localStorage.getItem(PERSISTENT_SESSION_KEY) === "true";
  }

  getPersistentExpiry(): number | null {
    const raw = localStorage.getItem(PERSISTENT_EXPIRY_KEY);
    return raw ? parseInt(raw, 10) : null;
  }

  getPersistentSessionDaysLeft(): number {
    const expiry = this.getPersistentExpiry();
    if (!expiry) return 0;
    return Math.max(
      0,
      Math.ceil((expiry - Date.now()) / (24 * 60 * 60 * 1000)),
    );
  }

  getRememberedUsername(): string {
    return localStorage.getItem(REMEMBERED_USERNAME_KEY) ?? "";
  }

  // ── Token refresh ────────────────────────────────────────────────────────────

  /**
   * Refresh the access token using the stored refresh token.
   *
   * Concurrent-safe: if a refresh is already in flight, all callers await
   * the same promise instead of firing duplicate requests.
   *
   * The backend rotates the refresh token on every call — the old token is
   * revoked and a new one is issued.
   */
  async refreshToken(): Promise<AuthResponse> {
    if (this._refreshPromise) return this._refreshPromise;

    this._refreshPromise = this._doRefresh().finally(() => {
      this._refreshPromise = null;
    });

    return this._refreshPromise;
  }

  private async _doRefresh(): Promise<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) throw new Error("No refresh token available");

    try {
      const response = await secureInvoke<AuthResponse>(
        "refresh_access_token",
        { request: { refresh_token: refreshToken } },
      );

      this._applyAuthResponse(response);

      const user = this.getCurrentUser();
      if (user) {
        this._storeUser({
          ...user,
          companyIds: response.company_ids ?? [],
          defaultCompanyId: response.default_company_id,
        });
      }

      this._scheduleTokenRefresh(response.expires_in);
      return response;
    } catch (error) {
      this._clearSession();
      throw new Error(`Token refresh failed: ${error}`);
    }
  }

  async verifyToken(token: string): Promise<User> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await secureInvoke<any>("verify_access_token", {
        token,
      });
      return this._mapUser(response);
    } catch (error) {
      throw new Error(`Token verification failed: ${error}`);
    }
  }

  // ── Logout ───────────────────────────────────────────────────────────────────

  /**
   * Full logout:
   *   1. Calls the backend to revoke the refresh token server-side.
   *   2. Clears all in-memory and localStorage state.
   *   3. Keeps the remembered username if "remember me" was active.
   */
  logout(): void {
    this._cancelTokenRefresh();

    const hadRememberMe = this.hasPersistentSession();
    const refreshToken = this.getRefreshToken();

    // Fire-and-forget backend revocation — don't block the UI
    if (refreshToken) {
      secureInvoke("logout", { refresh_token: refreshToken }).catch((err) => {
        console.warn(
          "[AuthService] Backend token revocation failed (non-critical):",
          err,
        );
      });
    }

    this._clearSession();

    // Keep remembered username only when "remember me" was active
    if (!hadRememberMe) {
      localStorage.removeItem(REMEMBERED_USERNAME_KEY);
    }
  }

  // ── Auth state ───────────────────────────────────────────────────────────────

  getCurrentUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  }

  /** Returns the in-memory access token from the token registry. */
  getAccessToken(): string | null {
    return getAccessToken();
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  /**
   * Async auth check — auto-refreshes if the token has < 5 minutes left.
   * Used by the `useAuth` polling loop.
   */
  async isAuthenticated(): Promise<boolean> {
    // No token in memory at all — try refresh if we have a refresh token
    if (!hasValidAccessToken()) {
      const rt = this.getRefreshToken();
      if (!rt) return false;
      try {
        await this.refreshToken();
        return true;
      } catch {
        this._clearSession();
        return false;
      }
    }

    // Token exists but close to expiry (< 5 min) — proactively refresh
    const expiry = this._getStoredExpiry();
    if (expiry && expiry < Date.now() + 5 * 60_000) {
      try {
        await this.refreshToken();
        return true;
      } catch {
        this._clearSession();
        return false;
      }
    }

    return true;
  }

  /** Synchronous check — no refresh, used for initial render decisions. */
  isAuthenticatedSync(): boolean {
    return hasValidAccessToken();
  }

  // ── Idle timeout ─────────────────────────────────────────────────────────────

  private _idleTimer: ReturnType<typeof setTimeout> | null = null;
  private _onIdleLogout: (() => void) | null = null;

  /**
   * Start (or restart) the idle timeout.
   * @param timeoutMinutes  0 = disabled
   * @param onLogout        Called when the timer fires
   */
  resetIdleTimer(timeoutMinutes: number, onLogout: () => void): void {
    if (timeoutMinutes <= 0) {
      this._clearIdleTimer();
      return;
    }
    this._onIdleLogout = onLogout;
    this._clearIdleTimer();
    this._idleTimer = setTimeout(
      () => {
        console.info(
          `[AuthService] Idle timeout (${timeoutMinutes}m) — logging out.`,
        );
        this._onIdleLogout?.();
      },
      timeoutMinutes * 60 * 1000,
    );
  }

  stopIdleTimer(): void {
    this._clearIdleTimer();
    this._onIdleLogout = null;
  }

  private _clearIdleTimer(): void {
    if (this._idleTimer) {
      clearTimeout(this._idleTimer);
      this._idleTimer = null;
    }
  }

  // ── User management ──────────────────────────────────────────────────────────

  async getUser(user_id: string): Promise<User> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return this._mapUser(await secureInvoke<any>("get_user", { user_id }));
    } catch (error) {
      throw new Error(`Failed to get user: ${error}`);
    }
  }

  async listUsers(): Promise<User[]> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (await secureInvoke<any[]>("list_users")).map((u) =>
        this._mapUser(u),
      );
    } catch (error) {
      throw new Error(`Failed to list users: ${error}`);
    }
  }

  async createUser(
    username: string,
    password: string,
    name: string,
    role: string,
  ): Promise<User> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return this._mapUser(
        await secureInvoke<any>("create_user", {
          username,
          password,
          name,
          role,
        }),
      );
    } catch (error) {
      throw new Error(`Failed to create user: ${error}`);
    }
  }

  async updateUser(
    user_id: string,
    name: string,
    role: string,
    is_active: boolean,
  ): Promise<User> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return this._mapUser(
        await secureInvoke<any>("update_user", {
          user_id,
          name,
          role,
          is_active,
        }),
      );
    } catch (error) {
      throw new Error(`Failed to update user: ${error}`);
    }
  }

  async updateUserCompanies(
    userId: string,
    companyIds: string[],
    defaultCompanyId?: string,
  ): Promise<User> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return this._mapUser(
        await secureInvoke<any>("update_user_companies", {
          userId,
          companyIds,
          defaultCompanyId,
        }),
      );
    } catch (error) {
      throw new Error(`Failed to update user company links: ${error}`);
    }
  }

  async changePassword(
    user_id: string,
    old_password: string,
    new_password: string,
  ): Promise<void> {
    try {
      await secureInvoke<void>("change_password", {
        user_id,
        old_password,
        new_password,
      });
    } catch (error) {
      throw new Error(`Failed to change password: ${error}`);
    }
  }

  // ── Company helpers ──────────────────────────────────────────────────────────

  setCurrentCompany(companyId: string): void {
    localStorage.setItem(CURRENT_COMPANY_ID_KEY, companyId);
  }

  getCurrentCompany(): string | null {
    return localStorage.getItem(CURRENT_COMPANY_ID_KEY);
  }

  getAccessibleCompanies(): string[] {
    const raw = localStorage.getItem(COMPANY_IDS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  }

  addAccessibleCompany(companyId: string): void {
    const current = this.getAccessibleCompanies();
    if (!current.includes(companyId)) {
      localStorage.setItem(
        COMPANY_IDS_KEY,
        JSON.stringify([...current, companyId]),
      );
    }
    this.setCurrentCompany(companyId);
  }

  removeAccessibleCompany(companyId: string): void {
    const updated = this.getAccessibleCompanies().filter(
      (id) => id !== companyId,
    );
    localStorage.setItem(COMPANY_IDS_KEY, JSON.stringify(updated));
    if (this.getCurrentCompany() === companyId) this.clearCurrentCompany();
  }

  clearCurrentCompany(): void {
    localStorage.removeItem(CURRENT_COMPANY_ID_KEY);
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  /**
   * Apply a successful auth response:
   *   - Access token → tokenRegistry (memory only, never localStorage)
   *   - Refresh token → localStorage (rotated by backend on every refresh)
   *   - Expiry + user metadata → localStorage
   */
  private _applyAuthResponse(response: AuthResponse): void {
    // Access token: memory only via tokenRegistry
    setAccessToken(response.access_token, response.expires_in);

    // Refresh token: localStorage (rotated by backend on every use)
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);

    // Expiry timestamp for _getStoredExpiry() checks
    localStorage.setItem(
      TOKEN_EXPIRY_KEY,
      (Date.now() + response.expires_in * 1000).toString(),
    );

    this._storeUser({
      id: response.user_id,
      username: response.username,
      email: response.email,
      name: response.name,
      role: response.role,
      companyIds: response.company_ids ?? [],
      defaultCompanyId: response.default_company_id,
      is_active: true,
    });
  }

  private _storeUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  private _storeAccessibleCompanies(companyIds: string[]): void {
    localStorage.setItem(
      COMPANY_IDS_KEY,
      JSON.stringify(Array.isArray(companyIds) ? companyIds : []),
    );
  }

  private _getStoredExpiry(): number | null {
    const raw = localStorage.getItem(TOKEN_EXPIRY_KEY);
    return raw ? parseInt(raw, 10) : null;
  }

  private _clearSession(): void {
    clearAccessToken();
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    this._clearPersistentSession();
    this._clearCompanyData();
  }

  private _clearPersistentSession(): void {
    localStorage.removeItem(PERSISTENT_SESSION_KEY);
    localStorage.removeItem(PERSISTENT_EXPIRY_KEY);
  }

  private _clearCompanyData(): void {
    localStorage.removeItem(CURRENT_COMPANY_ID_KEY);
    localStorage.removeItem(COMPANY_IDS_KEY);
  }

  private _scheduleTokenRefresh(expiresIn: number): void {
    this._cancelTokenRefresh();
    const refreshTime = Math.max((expiresIn - 60) * 1000, 0);
    this._refreshTimer = setTimeout(() => {
      this.refreshToken().catch((error) => {
        console.error("[AuthService] Auto token refresh failed:", error);
        this._clearSession();
      });
    }, refreshTime);
  }

  private _cancelTokenRefresh(): void {
    if (this._refreshTimer) {
      clearTimeout(this._refreshTimer);
      this._refreshTimer = null;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _mapUser(u: any): User {
    return {
      id: u.id,
      username: u.username,
      email: u.email,
      name: u.name,
      role: u.role,
      companyIds: u.company_ids ?? [],
      defaultCompanyId: u.default_company_id,
      is_active: u.is_active,
    };
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────────

export const authService = new AuthService();

export function clearAuthState(): void {
  authService.logout();
}
