import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "@/pages/Login";
import { DashboardPage } from "@/pages/Dashboard";
import { VehicleArrivalRegisterPage } from "@/pages/VehicleArrivalRegister";
import { PartiesPage } from "@/pages/Parties";
import { SuppliersPage } from "@/pages/Suppliers";
import { LedgerPage } from "@/pages/Ledger";
import { SalesAndPurchasePage } from "@/pages/SalesAndPurchase";
import { InventoryPage } from "@/pages/Inventory";
import { PaymentsPage } from "@/pages/Payments";
import { ReportsPage } from "@/pages/Reports";
import { SettingsPage } from "@/pages/Settings";
import { SearchPage } from "@/pages/Search";
import { CreateCompanyPage } from "@/pages/CreateCompany";
import { ManageCompaniesPage } from "@/pages/ManageCompanies";
import {
  ProtectedCompanyRoute,
  ProtectedRoute,
} from "@/components/ProtectedCompanyRoute";
import { AppLayout } from "@/components/AppLayout";
import { SelectCompanyState } from "@/components/SelectCompanyState";

/**
 * Main router configuration with multi-company routes
 * Structure: /app/:companyId/page for all authenticated pages
 * Structure: /login for authentication
 */
export function AppRoutes() {
  return (
    <Routes>
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
        path="/manage-companies"
        element={
          <ProtectedRoute>
            <ManageCompaniesPage />
          </ProtectedRoute>
        }
      />

      {/* Main App Routes with Company Context */}
      <Route
        path="/app/:companyId"
        element={
          <ProtectedCompanyRoute>
            <AppLayout />
          </ProtectedCompanyRoute>
        }
      >
        {/* Dashboard */}
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Operations */}
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

        {/* Inventory */}
        <Route path="inventory" element={<InventoryPage />} />

        {/* Finance */}
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="reports" element={<ReportsPage />} />

        {/* Tools */}
        <Route path="search" element={<SearchPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Catch-all redirects to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
