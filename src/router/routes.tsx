import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import {
  ProtectedCompanyRoute,
  ProtectedRoute,
} from "@/components/ProtectedCompanyRoute";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/auth";

const LoginPage = lazy(() =>
  import("@/pages/Login").then((mod) => ({ default: mod.LoginPage })),
);
const DashboardPage = lazy(() =>
  import("@/pages/Dashboard").then((mod) => ({ default: mod.DashboardPage })),
);
const VehicleArrivalRegisterPage = lazy(() =>
  import("@/pages/VehicleArrivalRegister").then((mod) => ({
    default: mod.VehicleArrivalRegisterPage,
  })),
);
const PartiesPage = lazy(() =>
  import("@/pages/Parties").then((mod) => ({ default: mod.PartiesPage })),
);
const PartyDetailsPage = lazy(() =>
  import("@/pages/PartyDetails").then((mod) => ({
    default: mod.PartyDetailsPage,
  })),
);
const SalesAndPurchasePage = lazy(() =>
  import("@/pages/SalesAndPurchase").then((mod) => ({
    default: mod.SalesAndPurchasePage,
  })),
);
const PurchasePage = lazy(() =>
  import("@/pages/PurchasePage").then((mod) => ({ default: mod.PurchasePage })),
);
const InventoryPage = lazy(() =>
  import("@/pages/Inventory").then((mod) => ({ default: mod.InventoryPage })),
);
const PaymentsPage = lazy(() =>
  import("@/pages/Payments").then((mod) => ({ default: mod.PaymentsPage })),
);
const ReportsPage = lazy(() =>
  import("@/pages/Reports").then((mod) => ({ default: mod.ReportsPage })),
);
const SettingsPage = lazy(() =>
  import("@/pages/Settings").then((mod) => ({ default: mod.SettingsPage })),
);
const SearchPage = lazy(() =>
  import("@/pages/Search").then((mod) => ({ default: mod.SearchPage })),
);
const CreateCompanyPage = lazy(() =>
  import("@/pages/CreateCompany").then((mod) => ({
    default: mod.CreateCompanyPage,
  })),
);
const EditCompanyPage = lazy(() =>
  import("@/pages/EditCompany").then((mod) => ({
    default: mod.EditCompanyPage,
  })),
);
const ManageCompaniesPage = lazy(() =>
  import("@/pages/ManageCompanies").then((mod) => ({
    default: mod.ManageCompaniesPage,
  })),
);
const SelectCompanyPage = lazy(() =>
  import("@/pages/SelectCompany").then((mod) => ({
    default: mod.SelectCompanyPage,
  })),
);
const NoCompanyAssignedPage = lazy(() =>
  import("@/pages/NoCompanyAssigned").then((mod) => ({
    default: mod.NoCompanyAssignedPage,
  })),
);
const AppLayout = lazy(() =>
  import("@/components/AppLayout").then((mod) => ({ default: mod.AppLayout })),
);

/**
 * Redirects users to the appropriate starting page based on auth status
 */
function RootRedirect() {
  const { isAuthenticated, isInitializing } = useAuth();
  const lastCompanyId = authService.getCurrentCompany();
  const accessibleCompanies = authService.getAccessibleCompanies();

  if (isInitializing && authService.hasPersistentSession()) {
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
function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageFallback />}>
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
            <Route path="parties/:partyId" element={<PartyDetailsPage />} />

            {/* Ledger & Transactions */}
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
    </Suspense>
  );
}
