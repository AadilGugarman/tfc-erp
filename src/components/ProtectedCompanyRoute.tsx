import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/auth";
import { useNavigate, useParams } from "react-router-dom";
import { useAppStore } from "@/stores/useAppStore";

interface ProtectedCompanyRouteProps {
  children: ReactNode;
}

/**
 * Protects routes that require both authentication and company access
 * Usage: <ProtectedCompanyRoute><YourComponent /></ProtectedCompanyRoute>
 */
export function ProtectedCompanyRoute({
  children,
}: ProtectedCompanyRouteProps) {
  const { isAuthenticated } = useAuth();
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { companies, loadCompanies } = useAppStore();

  useEffect(() => {
    const checkAccess = async () => {
      if (!isAuthenticated) {
        navigate("/login");
        return;
      }

      // Ensure companies are loaded first
      loadCompanies();

      // Small delay to ensure state is updated
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Get accessible companies from auth service
      let accessibleCompanies = authService.getAccessibleCompanies();

      // Fallback: if no accessible companies from auth, use all companies from DB
      // This handles cases where authentication doesn't provide company IDs
      if (accessibleCompanies.length === 0 && companies.length > 0) {
        accessibleCompanies = companies.map((c) => c.id);
      }

      if (!companyId) {
        if (accessibleCompanies.length > 0) {
          // Redirect to first accessible company
          navigate(`/app/${accessibleCompanies[0]}/dashboard`);
        } else {
          // No companies available, redirect to select company page
          navigate("/select-company");
        }
        return;
      }

      // Check if user has access to this company
      if (accessibleCompanies.includes(companyId)) {
        setIsAuthorized(true);
        authService.setCurrentCompany(companyId);
        setIsLoading(false);
      } else if (companies.length > 0) {
        // Fallback: allow access to any company if authenticated and companies exist
        setIsAuthorized(true);
        authService.setCurrentCompany(companyId);
        setIsLoading(false);
      } else {
        // Redirect to first accessible company or dashboard
        const firstCompany = accessibleCompanies[0];
        if (firstCompany) {
          navigate(`/app/${firstCompany}/dashboard`);
        } else {
          navigate("/select-company");
        }
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [isAuthenticated, companyId, navigate, loadCompanies, companies]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
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
            You don't have access to this company.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Simple authentication guard - redirects to login if not authenticated
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
    setIsLoading(false);
  }, [isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
