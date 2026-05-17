import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/auth";
import { useNavigate, useParams, Outlet } from "react-router-dom";
import { useAppStore } from "@/stores/useAppStore";

/**
 * Protects routes that require both authentication and company access
 * This component assumes a companyId is present in the URL (`/app/:companyId/*`)
 * Usage: Used as a nested route element in AppRoutes
 */
export function ProtectedCompanyRoute() {
  const { isAuthenticated, isInitializing: authLoading } = useAuth();
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { companies, companiesLoaded, currentCompanyId, setCurrentCompanyId } = useAppStore();

  useEffect(() => {
    const checkAccess = async () => {
      if (authLoading) return;

      if (!isAuthenticated) {
        navigate("/login");
        return;
      }

      // If companies aren't loaded yet, wait for them
      if (!companiesLoaded) {
        return;
      }

      const accessibleCompanies = authService.getAccessibleCompanies();

      // This route MUST have a companyId in the URL
      if (!companyId) {
        navigate("/app/dashboard");
        return;
      }

      // Check if user has access to this company
      if (accessibleCompanies.includes(companyId)) {
        // Sync the store if needed
        if (currentCompanyId !== companyId) {
          setCurrentCompanyId(companyId);
        }
        setIsAuthorized(true);
        setIsLoading(false);
      } else {
        // Company in URL is not accessible, or user has no companies at all
        if (accessibleCompanies.length > 0) {
          navigate("/select-company");
        } else {
          navigate("/no-company");
        }
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [
    isAuthenticated,
    authLoading,
    companyId,
    navigate,
    companies.length,
    currentCompanyId,
    setCurrentCompanyId,
  ]);

  if (authLoading || (isLoading && isAuthenticated)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {authLoading
              ? "Verifying session..."
              : "Loading company context..."}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You do not have access to this company or it does not exist.
          </p>
          <button
            onClick={() => navigate("/app/dashboard")}
            className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-md"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

/**
 * Simple authentication guard - redirects to login if not authenticated
 */
import { ReactNode } from "react";

export interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { isAuthenticated, user, isInitializing } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isInitializing) return;

    if (!isAuthenticated) {
      navigate("/login");
    }
    setIsLoading(false);
  }, [isAuthenticated, isInitializing, navigate]);

  if (isInitializing || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {isInitializing ? "Checking session..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  // Check role if required
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-slate-600 mb-4">
            You do not have permission to access this page.
          </p>
          <p className="text-sm text-slate-500">
            Required role: <strong>{requiredRole}</strong>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
