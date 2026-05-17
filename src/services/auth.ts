import { secureInvoke } from "@/utils/tauri";

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

const safeInvoke = secureInvoke;

class AuthService {
  /**
   * Check if any user exists in the database
   */
  async hasUsers(): Promise<boolean> {
    const status = await this.getSetupStatus();
    return status.hasUsers;
  }

  /**
   * Check whether initial admin setup is required.
   * On backend errors, assumes setup is needed so the setup form is shown.
   */
  async getSetupStatus(): Promise<{
    hasUsers: boolean;
    error?: string;
  }> {
    try {
      const hasUsers = await safeInvoke<boolean>("has_users", undefined, {
        maxAttempts: 50,
        delayMs: 200,
      });
      return { hasUsers };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      console.error("[AuthService] getSetupStatus failed:", error);
      return {
        hasUsers: false,
        error: message,
      };
    }
  }

  /**
   * Setup the initial admin user
   */
  async clearUsersForSetup(): Promise<void> {
    await safeInvoke("clear_users_for_setup");
  }

  async setupInitialAdmin(data: {
    username: string;
    password: string;
    name: string;
    email: string;
  }): Promise<AuthResponse> {
    try {
      const response = await safeInvoke<AuthResponse>(
        "setup_initial_admin",
        data,
      );

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

      this.scheduleTokenRefresh(response.expires_in);
      return response;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      throw new Error(
        message.startsWith("Setup failed:")
          ? message
          : message.replace(/^Command failed:\s*/i, ""),
      );
    }
  }

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

      // Store accessible companies and preserve previous selection
      const companyIds = response.company_ids || [];
      this.storeAccessibleCompanies(companyIds);

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

      // Update stored user if needed
      const user = this.getCurrentUser();
      if (user) {
        this.storeUser({
          ...user,
          companyIds: response.company_ids || [],
          defaultCompanyId: response.default_company_id,
        });
      }

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
      const response = await safeInvoke<any>("verify_access_token", { token });
      return {
        id: response.id,
        username: response.username,
        email: response.email,
        name: response.name,
        role: response.role,
        companyIds: response.company_ids || [],
        defaultCompanyId: response.default_company_id,
        is_active: response.is_active,
      };
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

    // Check if token is strictly expired
    if (expiry && expiry < Date.now()) {
      return false;
    }

    return true;
  }

  /**
   * Get user by ID (admin only)
   */
  async getUser(user_id: string): Promise<User> {
    try {
      const response = await safeInvoke<any>("get_user", { user_id });
      return {
        id: response.id,
        username: response.username,
        email: response.email,
        name: response.name,
        role: response.role,
        companyIds: response.company_ids || [],
        defaultCompanyId: response.default_company_id,
        is_active: response.is_active,
      };
    } catch (error) {
      throw new Error(`Failed to get user: ${error}`);
    }
  }

  /**
   * List all users (admin only)
   */
  async listUsers(): Promise<User[]> {
    try {
      const response = await safeInvoke<any[]>("list_users");
      return response.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        name: u.name,
        role: u.role,
        companyIds: u.company_ids || [],
        defaultCompanyId: u.default_company_id,
        is_active: u.is_active,
      }));
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
      const response = await safeInvoke<any>("create_user", {
        username,
        password,
        name,
        role,
      });
      return {
        id: response.id,
        username: response.username,
        email: response.email,
        name: response.name,
        role: response.role,
        companyIds: response.company_ids || [],
        defaultCompanyId: response.default_company_id,
        is_active: response.is_active,
      };
    } catch (error) {
      throw new Error(`Failed to create user: ${error}`);
    }
  }

  /**
   * Update user (admin only)
   */
  async updateUser(
    user_id: string,
    name: string,
    role: string,
    is_active: boolean,
  ): Promise<User> {
    try {
      const response = await safeInvoke<any>("update_user", {
        user_id,
        name,
        role,
        is_active,
      });
      return {
        id: response.id,
        username: response.username,
        email: response.email,
        name: response.name,
        role: response.role,
        companyIds: response.company_ids || [],
        defaultCompanyId: response.default_company_id,
        is_active: response.is_active,
      };
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
      const response = await safeInvoke<any>("update_user_companies", {
        userId: userId,
        companyIds: companyIds,
        defaultCompanyId: defaultCompanyId,
      });
      return {
        id: response.id,
        username: response.username,
        email: response.email,
        name: response.name,
        role: response.role,
        companyIds: response.company_ids || [],
        defaultCompanyId: response.default_company_id,
        is_active: response.is_active,
      };
    } catch (error) {
      throw new Error(`Failed to update user company links: ${error}`);
    }
  }

  /**
   * Change password
   */
  async changePassword(
    user_id: string,
    old_password: string,
    new_password: string,
  ): Promise<void> {
    try {
      await safeInvoke<void>("change_password", {
        user_id,
        old_password,
        new_password,
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
    const ids = Array.isArray(companyIds) ? companyIds : [];
    localStorage.setItem(COMPANY_IDS_KEY, JSON.stringify(ids));

    // Do not automatically set a current company here. Let the app decide based on user preference or selection.
  }

  addAccessibleCompany(companyId: string): void {
    const currentCompanies = this.getAccessibleCompanies();
    if (!currentCompanies.includes(companyId)) {
      const updated = [...currentCompanies, companyId];
      localStorage.setItem(COMPANY_IDS_KEY, JSON.stringify(updated));
    }
    this.setCurrentCompany(companyId);
  }

  removeAccessibleCompany(companyId: string): void {
    const updated = this.getAccessibleCompanies().filter(
      (id) => id !== companyId,
    );
    localStorage.setItem(COMPANY_IDS_KEY, JSON.stringify(updated));
    if (this.getCurrentCompany() === companyId) {
      this.clearCurrentCompany();
    }
  }

  clearCurrentCompany(): void {
    localStorage.removeItem(CURRENT_COMPANY_ID_KEY);
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
