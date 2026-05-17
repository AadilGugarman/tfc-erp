import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

/**
 * Component that protects routes requiring authentication
 * Optionally enforces role-based access control (RBAC)
 */
export function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate("/login");
      } else {
        setLoading(false);
      }
    }
  }, [isAuthenticated, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Authenticating...</p>
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
