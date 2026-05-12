import { useEffect, useState, useCallback } from "react";
import { authService } from "@/services/auth";

export interface UseAuthReturn {
  isAuthenticated: boolean;
  user: ReturnType<typeof authService.getCurrentUser>;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

/**
 * Custom hook for authentication state management
 * Handles token refresh, session persistence, and auto-logout
 */
export function useAuth(): UseAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(
    authService.isAuthenticatedSync(),
  );
  const [user, setUser] = useState(authService.getCurrentUser());
  const [loading, setLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Check authentication status on mount and when auth service changes
  useEffect(() => {
    let isMounted = true;
    let intervalHandle: NodeJS.Timeout | null = null;

    const checkAuth = async () => {
      // Skip check if logging out
      if (isLoggingOut) return;

      try {
        // Use async check to auto-refresh if needed
        const isAuth = await authService.isAuthenticated();
        if (isMounted && !isLoggingOut) {
          setIsAuthenticated(isAuth);
          setUser(authService.getCurrentUser());
        }
      } catch (error) {
        console.error("[useAuth] Auth check failed:", error);
        if (isMounted && !isLoggingOut) {
          setIsAuthenticated(false);
          setUser(null);
        }
      }
    };

    // Check immediately on mount
    checkAuth();

    // Set up interval to check auth status every 20 seconds (auto-refresh if needed)
    intervalHandle = setInterval(checkAuth, 20000);

    return () => {
      isMounted = false;
      if (intervalHandle) clearInterval(intervalHandle);
    };
  }, [isLoggingOut]);

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    try {
      await authService.login(username, password);
      setIsAuthenticated(true);
      setUser(authService.getCurrentUser());
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    // Flag logout to stop background checks immediately
    setIsLoggingOut(true);
    // Clear state immediately (synchronous, no await)
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  return {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
  };
}
