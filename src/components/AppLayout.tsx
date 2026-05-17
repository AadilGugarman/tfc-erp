import { Outlet, useParams } from "react-router-dom";
import { useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useAppStore } from "@/stores/useAppStore";

/**
 * Main layout wrapper for authenticated pages
 * Provides header and sidebar for all app routes
 * Syncs company context from URL
 */
export function AppLayout() {
  const {
    sidebarOpen,
    setCurrentCompanyId,
    refreshDataFromDb,
    companies,
    loadCompanies,
  } = useAppStore();
  const { companyId } = useParams<{ companyId: string }>();

  useEffect(() => {
    if (companyId) {
      setCurrentCompanyId(companyId);
    }
  }, [companyId, setCurrentCompanyId]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <Header />

      {/* Main Content with Sidebar */}
      <div className="flex pt-16">
        {/* Sidebar */}
        <Sidebar />

        {/* Content Area */}
        <main
          className="flex-1 transition-all duration-300"
          style={{
            marginLeft: sidebarOpen ? 225 : 66,
          }}
        >
          <div className="pl-0 pr-5 py-4 lg:pr-6 lg:py-5">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
