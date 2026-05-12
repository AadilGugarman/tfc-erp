import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { LoginPage } from "@/pages/Login";

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
  const { isAuthenticated, user, login } = useAuth();

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />;
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
