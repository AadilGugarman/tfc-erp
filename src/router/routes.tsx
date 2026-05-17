import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { LoginPage } from "@/pages/Login";
import { DashboardPage } from "@/pages/Dashboard";
import { VehicleArrivalRegisterPage } from "@/pages/VehicleArrivalRegister";
import { PartiesPage } from "@/pages/Parties";
import { SuppliersPage } from "@/pages/Suppliers";
import { LedgerPage } from "@/pages/Ledger";
import { SalesAndPurchasePage } from "@/pages/SalesAndPurchase";
import { PurchasePage } from "@/pages/PurchasePage";
import { InventoryPage } from "@/pages/Inventory";
import { PaymentsPage } from "@/pages/Payments";
import { ReportsPage } from "@/pages/Reports";
import { SettingsPage } from "@/pages/Settings";
import { SearchPage } from "@/pages/Search";
import { CreateCompanyPage } from "@/pages/CreateCompany";
import { EditCompanyPage } from "@/pages/EditCompany";
import { ManageCompaniesPage } from "@/pages/ManageCompanies";
import { SelectCompanyPage } from "@/pages/SelectCompany";
import { NoCompanyAssignedPage } from "@/pages/NoCompanyAssigned";
import {
  ProtectedCompanyRoute,
  ProtectedRoute,
} from "@/components/ProtectedCompanyRoute";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/auth";

/**
 * Redirects users to the appropriate starting page based on auth status
 */
function RootRedirect() {
  const { isAuthenticated, isInitializing } = useAuth();
  const lastCompanyId = authService.getCurrentCompany();
  const accessibleCompanies = authService.getAccessibleCompanies();

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If we have a last selected company, use it
  if (lastCompanyId && accessibleCompanies.includes(lastCompanyId)) {
    return <Navigate to={`/app/${lastCompanyId}/dashboard`} replace />;
  }

  // If we have companies but none selected, pick the first one automatically
  // (As requested: directly navigate to dashboard if there's more than one)
  if (accessibleCompanies.length > 0) {
    const firstCompanyId = accessibleCompanies[0];
    return <Navigate to={`/app/${firstCompanyId}/dashboard`} replace />;
  }

  // If no companies at all, go to selection/creation screen
  return <Navigate to="/select-company" replace />;
}

/**
 * Main router configuration with multi-company routes
 */
export function AppRoutes() {
  return (
    <Routes>
      {/* Root redirection */}
      <Route path="/" element={<RootRedirect />} />

      {/* Authentication */}
      <Route path="/login" element={<LoginPage />} />

      {/* Company Management (Authenticated users) */}
      <Route
        path="/create-company"
        element={
          <ProtectedRoute>
            <CreateCompanyPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/edit-company/:companyId"
        element={
          <ProtectedRoute>
            <EditCompanyPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manage-companies"
        element={
          <ProtectedRoute>
            <ManageCompaniesPage />
          </ProtectedRoute>
        }
      />

      {/* Main App Routes (Authenticated users) */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RootRedirect />} />
        <Route path="dashboard" element={<RootRedirect />} />

        {/* Nested routes requiring company context */}
        <Route path=":companyId" element={<ProtectedCompanyRoute />}>
          {/* Operations */}
          <Route path="dashboard" element={<DashboardPage />} />
          <Route
            path="vehicle-register"
            element={<VehicleArrivalRegisterPage />}
          />

          {/* Masters */}
          <Route path="parties" element={<PartiesPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />

          {/* Ledger & Transactions */}
          <Route path="ledger" element={<LedgerPage />} />
          <Route path="transactions" element={<SalesAndPurchasePage />} />
          <Route path="purchases" element={<PurchasePage />} />

          {/* Inventory */}
          <Route path="inventory" element={<InventoryPage />} />

          {/* Finance */}
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="reports" element={<ReportsPage />} />

          {/* Tools */}
          <Route path="search" element={<SearchPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route
        path="/select-company"
        element={
          <ProtectedRoute>
            <SelectCompanyPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/no-company"
        element={
          <ProtectedRoute>
            <NoCompanyAssignedPage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirects back to root which handles intelligent redirection */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
