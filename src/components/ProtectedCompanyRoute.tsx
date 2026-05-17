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
  const { isAuthenticated } = useAuth();
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { companies, loadCompanies, setCurrentCompanyId } = useAppStore();

  useEffect(() => {
    const checkAccess = async () => {
      if (!isAuthenticated) {
        navigate("/login");
        return;
      }

      // Ensure companies are loaded
      if (companies.length === 0) {
        await loadCompanies(); // Ensure companies are loaded before checking access
      }

      const accessibleCompanies = authService.getAccessibleCompanies();

      // This route MUST have a companyId in the URL
      if (!companyId) {
        // If we somehow landed here without a companyId, redirect to generic dashboard
        navigate("/app/dashboard");
        return;
      }

      // Check if user has access to this company
      if (accessibleCompanies.includes(companyId)) {
        setCurrentCompanyId(companyId); // Set the company in the store
        setIsAuthorized(true);
        setIsLoading(false);
      } else {
        // Company in URL is not accessible, or user has no companies at all
        if (accessibleCompanies.length > 0) {
          navigate("/select-company"); // User has companies, but not this one
        } else {
          navigate("/no-company"); // User has no accessible companies
        }
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [isAuthenticated, companyId, navigate, loadCompanies, companies.length, setCurrentCompanyId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading company context...</p>
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
          <p className="text-gray-600 dark:text-gray-400">You do not have access to this company or it does not exist.</p>
          <button onClick={() => navigate("/app/dashboard")} className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-md">
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