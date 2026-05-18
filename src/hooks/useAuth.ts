import { useEffect, useState, useCallback, useRef } from "react";
import { authService } from "@/services/auth";
import { useAppStore } from "@/stores/useAppStore";

export interface UseAuthReturn {
  isAuthenticated: boolean;
  user: ReturnType<typeof authService.getCurrentUser>;
  loading: boolean;
  /** True while the initial session check / restore is in progress. */
  isInitializing: boolean;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
}

/**
 * Custom hook for authentication state management.
 *
 * On mount:
 *   1. Attempts to silently restore a persistent ("remember me") session.
 *   2. Falls back to a normal async auth check.
 *
 * After init:
 *   - Polls every 20 s to keep the access token fresh.
 *   - Wires idle-timeout auto-logout to the security settings.
 *   - Attaches global interaction listeners to reset the idle timer.
 */
export function useAuth(): UseAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(
    authService.isAuthenticatedSync(),
  );
  const [user, setUser] = useState(authService.getCurrentUser());
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Read session timeout from security settings
  const sessionTimeoutMinutes = useAppStore(
    (s) => s.settings?.security?.sessionTimeoutMinutes ?? 60,
  );

  // Stable logout ref so idle-timer callback never captures a stale closure
  const logoutRef = useRef<() => void>(() => {});

  // ── Logout ───────────────────────────────────────────────────────────────────

  const logout = useCallback(() => {
    setIsLoggingOut(true);
    authService.stopIdleTimer();
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  // Keep the ref in sync with the latest logout function
  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  // ── Session initialisation + polling ─────────────────────────────────────────

  useEffect(() => {
    let isMounted = true;
    let pollHandle: ReturnType<typeof setInterval> | null = null;

    const initSession = async () => {
      if (isLoggingOut) return;
      try {
        // Step 1: Try to restore a persistent "remember me" session.
        // This calls refreshToken() which hits the backend to validate the
        // user is still active — satisfying "validate restored sessions with backend".
        const restored = await authService.tryRestorePersistentSession();

        if (isMounted && !isLoggingOut) {
          if (restored) {
            setIsAuthenticated(true);
            setUser(authService.getCurrentUser());
          } else {
            // Step 2: Normal async check for non-persistent sessions
            const isAuth = await authService.isAuthenticated();
            setIsAuthenticated(isAuth);
            setUser(authService.getCurrentUser());
          }
        }
      } catch (error) {
        console.error("[useAuth] Session initialisation failed:", error);
        if (isMounted && !isLoggingOut) {
          setIsAuthenticated(false);
          setUser(null);
        }
      } finally {
        if (isMounted) setIsInitializing(false);
      }
    };

    const checkAuth = async () => {
      if (isLoggingOut) return;
      try {
        const isAuth = await authService.isAuthenticated();
        if (isMounted && !isLoggingOut) {
          setIsAuthenticated(isAuth);
          setUser(authService.getCurrentUser());
        }
      } catch {
        if (isMounted && !isLoggingOut) {
          setIsAuthenticated(false);
          setUser(null);
        }
      }
    };

    initSession();
    pollHandle = setInterval(checkAuth, 20_000);

    return () => {
      isMounted = false;
      if (pollHandle) clearInterval(pollHandle);
    };
  }, [isLoggingOut]);

  // ── Idle timeout ──────────────────────────────────────────────────────────────
  //
  // Wired to settings.security.sessionTimeoutMinutes from the Zustand store.
  // Resets on every user interaction event.

  useEffect(() => {
    if (!isAuthenticated) {
      authService.stopIdleTimer();
      return;
    }

    const handleActivity = () => {
      authService.resetIdleTimer(sessionTimeoutMinutes, () => logoutRef.current());
    };

    // Start the timer immediately on login / mount
    authService.resetIdleTimer(sessionTimeoutMinutes, () => logoutRef.current());

    // Reset on any user interaction
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];
    events.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }));

    return () => {
      events.forEach((e) => window.removeEventListener(e, handleActivity));
      authService.stopIdleTimer();
    };
  }, [isAuthenticated, sessionTimeoutMinutes]);

  // ── Login ─────────────────────────────────────────────────────────────────────

  const login = useCallback(
    async (username: string, password: string, rememberMe = false) => {
      setLoading(true);
      try {
        await authService.login(username, password, rememberMe);
        setIsAuthenticated(true);
        setUser(authService.getCurrentUser());
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { isAuthenticated, user, loading, isInitializing, login, logout };
}
