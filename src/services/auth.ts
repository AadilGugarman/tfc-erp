import * as db from "@/db/db";

let tauriInvokePromise: Promise<
  ((cmd: string, args?: Record<string, unknown>) => Promise<unknown>) | null
> | null = null;

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

export interface Company {
  id: string;
  name: string;
  email: string;
  gstin: string;
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

// Token storage keys
const ACCESS_TOKEN_KEY = "tfc-erp-access-token";
const REFRESH_TOKEN_KEY = "tfc-erp-refresh-token";
const USER_KEY = "tfc-erp-user";
const TOKEN_EXPIRY_KEY = "tfc-erp-token-expiry";
const CURRENT_COMPANY_ID_KEY = "tfc-erp-current-company-id";
const COMPANY_IDS_KEY = "tfc-erp-company-ids";

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

async function getTauriInvoke(): Promise<
  ((cmd: string, args?: Record<string, unknown>) => Promise<unknown>) | null
> {
  if (!isTauriRuntime()) {
    return null;
  }

  if (!tauriInvokePromise) {
    tauriInvokePromise = import("@tauri-apps/api/core")
      .then((mod) => mod.invoke)
      .catch(() => null);
  }

  return tauriInvokePromise;
}

const waitForTauri = async (maxAttempts = 10, delayMs = 100): Promise<void> => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (isTauriRuntime()) {
      console.debug(
        "[AuthService] Tauri runtime detected after",
        attempt,
        "attempts",
      );
      return;
    }
    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  console.warn(
    "[AuthService] Tauri did not become available after",
    maxAttempts,
    "attempts",
  );
};

// Safe invoke with fallback
const safeInvoke = async <T>(
  command: string,
  args?: Record<string, unknown>,
): Promise<T> => {
  // Wait for Tauri to be available
  await waitForTauri();

  const invokeFn = await getTauriInvoke();
  if (!invokeFn) {
    console.warn(
      "Tauri backend is not available. Using development fallback mode.",
    );

    // Development fallback for login command
    if (command === "login" && args?.request) {
      const req = args.request as { username: string; password: string };
      if (req.username === "admin" && req.password === "admin123") {
        // Get actual companies from database
        const companies = db.getCompanies();
        const companyIds = companies.map((c) => c.id);
        const defaultCompanyId =
          companyIds.length > 0 ? companyIds[0] : undefined;

        return {
          user_id: "dev-user-1",
          username: "admin",
          email: "admin@talhafruitco.com",
          name: "Administrator",
          role: "admin",
          company_ids: companyIds,
          default_company_id: defaultCompanyId,
          access_token: "dev-access-token-" + Date.now(),
          refresh_token: "dev-refresh-token-" + Date.now(),
          expires_in: 3600,
        } as T;
      }
      throw new Error("Invalid username or password");
    }

    throw new Error(
      'Backend service unavailable. Please make sure you started the app with "npm run desktop:dev" and not just "npm run dev".',
    );
  }

  try {
    return (await invokeFn(command, args)) as T;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`Tauri command failed: ${command}`, error);
    throw new Error(`Command failed: ${errorMsg}`);
  }
};

class AuthService {
  /**
   * Login with username and password
   */
  async login(username: string, password: string): Promise<AuthResponse> {
    try {
      const response = await safeInvoke<AuthResponse>("login", {
        request: { username, password },
      });

      this.storeTokens(
        response.access_token,
        response.refresh_token,
        response.expires_in,
      );
      this.storeUser({
        id: response.user_id,
        username: response.username,
        email: response.email,
        name: response.name,
        role: response.role,
        companyIds: response.company_ids || [],
        defaultCompanyId: response.default_company_id,
        is_active: true,
      });

      // Store accessible companies and set current company
      const companyIds = response.company_ids || [];
      this.storeAccessibleCompanies(companyIds);
      if (response.default_company_id) {
        this.setCurrentCompany(response.default_company_id);
      } else if (companyIds.length > 0) {
        this.setCurrentCompany(companyIds[0]);
      }

      this.scheduleTokenRefresh(response.expires_in);
      return response;
    } catch (error) {
      throw new Error(`Login failed: ${error}`);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      const response = await safeInvoke<AuthResponse>("refresh_access_token", {
        refresh_token: refreshToken,
      });

      this.storeTokens(
        response.access_token,
        response.refresh_token,
        response.expires_in,
      );
      this.scheduleTokenRefresh(response.expires_in);
      return response;
    } catch (error) {
      this.logout();
      throw new Error(`Token refresh failed: ${error}`);
    }
  }

  /**
   * Verify access token validity
   */
  async verifyToken(token: string): Promise<User> {
    try {
      return await safeInvoke<User>("verify_access_token", { token });
    } catch (error) {
      throw new Error(`Token verification failed: ${error}`);
    }
  }

  /**
   * Logout user - INSTANT operation (no async)
   */
  logout(): void {
    // Cancel any pending token refresh immediately
    this.cancelTokenRefresh();
    // Clear all tokens and user data
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    // Clear company data
    this.clearCompanyData();
  }

  /**
   * Get current user from storage
   */
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  /**
   * Check if user is authenticated and auto-refresh if needed
   */
  async isAuthenticated(): Promise<boolean> {
    const token = this.getAccessToken();
    const expiry = this.getTokenExpiry();

    if (!token) return false;

    const now = Date.now();

    // Token is expired - try to refresh it
    if (expiry && expiry < now + 5 * 60000) {
      // Refresh if less than 5 minutes left
      try {
        await this.refreshToken();
        return true;
      } catch (error) {
        console.error("[AuthService] Token refresh failed:", error);
        this.logout();
        return false;
      }
    }

    return true;
  }

  /**
   * Sync check without refresh (for internal validation)
   */
  isAuthenticatedSync(): boolean {
    const token = this.getAccessToken();
    const expiry = this.getTokenExpiry();

    if (!token) return false;

    // Check if token is expired (with 5 minute buffer for refresh)
    if (expiry && expiry < Date.now() + 5 * 60000) {
      return false;
    }

    return true;
  }

  /**
   * Get user by ID (admin only)
   */
  async getUser(userId: string): Promise<User> {
    try {
      return await safeInvoke<User>("get_user", { user_id: userId });
    } catch (error) {
      throw new Error(`Failed to get user: ${error}`);
    }
  }

  /**
   * List all users (admin only)
   */
  async listUsers(): Promise<User[]> {
    try {
      return await safeInvoke<User[]>("list_users");
    } catch (error) {
      throw new Error(`Failed to list users: ${error}`);
    }
  }

  /**
   * Create new user (admin only)
   */
  async createUser(
    username: string,
    password: string,
    name: string,
    role: string,
  ): Promise<User> {
    try {
      return await safeInvoke<User>("create_user", {
        username,
        password,
        name,
        role,
      });
    } catch (error) {
      throw new Error(`Failed to create user: ${error}`);
    }
  }

  /**
   * Update user (admin only)
   */
  async updateUser(
    userId: string,
    name: string,
    role: string,
    isActive: boolean,
  ): Promise<User> {
    try {
      return await safeInvoke<User>("update_user", {
        user_id: userId,
        name,
        role,
        is_active: isActive,
      });
    } catch (error) {
      throw new Error(`Failed to update user: ${error}`);
    }
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    try {
      await safeInvoke<void>("change_password", {
        user_id: userId,
        old_password: oldPassword,
        new_password: newPassword,
      });
    } catch (error) {
      throw new Error(`Failed to change password: ${error}`);
    }
  }

  // ===== Private Helper Methods =====

  private storeTokens(
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
  ): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

    // Store expiry time (expires_in is in seconds)
    const expiryTime = Date.now() + expiresIn * 1000;
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  }

  private storeUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  private getTokenExpiry(): number | null {
    const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
    return expiryStr ? parseInt(expiryStr, 10) : null;
  }

  private tokenRefreshTimeout: NodeJS.Timeout | null = null;

  /**
   * Schedule automatic token refresh before expiry (refresh 1 minute before expiry)
   */
  private scheduleTokenRefresh(expiresIn: number): void {
    this.cancelTokenRefresh();

    // Refresh 1 minute before expiry
    const refreshTime = (expiresIn - 60) * 1000;

    this.tokenRefreshTimeout = setTimeout(() => {
      this.refreshToken().catch((error) => {
        console.error("Auto token refresh failed:", error);
        this.logout();
      });
    }, refreshTime);
  }

  private cancelTokenRefresh(): void {
    if (this.tokenRefreshTimeout) {
      clearTimeout(this.tokenRefreshTimeout);
      this.tokenRefreshTimeout = null;
    }
  }

  /**
   * Set current company for the logged-in user
   */
  setCurrentCompany(companyId: string): void {
    localStorage.setItem(CURRENT_COMPANY_ID_KEY, companyId);
  }

  /**
   * Get current company ID (last selected company)
   */
  getCurrentCompany(): string | null {
    return localStorage.getItem(CURRENT_COMPANY_ID_KEY);
  }

  /**
   * Get all companies accessible to current user
   */
  getAccessibleCompanies(): string[] {
    const companiesStr = localStorage.getItem(COMPANY_IDS_KEY);
    return companiesStr ? JSON.parse(companiesStr) : [];
  }

  /**
   * Store accessible companies for logged-in user
   */
  private storeAccessibleCompanies(companyIds: string[] = []): void {
    // Ensure we have an array
    const ids = Array.isArray(companyIds) ? companyIds : [];
    localStorage.setItem(COMPANY_IDS_KEY, JSON.stringify(ids));

    // Set default to first company or restore previously selected
    const currentCompany = this.getCurrentCompany();
    if (!currentCompany && ids.length > 0) {
      this.setCurrentCompany(ids[0]);
    }
  }

  /**
   * Clear company data on logout
   */
  private clearCompanyData(): void {
    localStorage.removeItem(CURRENT_COMPANY_ID_KEY);
    localStorage.removeItem(COMPANY_IDS_KEY);
  }
}

// Export singleton instance
export const authService = new AuthService();

/**
 * Clear all authentication state (useful for development/testing)
 */
export function clearAuthState(): void {
  authService.logout();
}
