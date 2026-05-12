import { useEffect } from "react";
import * as db from "@/db/db";
import { useAppStore } from "@/stores/useAppStore";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
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
import { CommandPalette } from "@/components/CommandPalette";
import { useGlobalKeyboardManager } from "@/hooks/useGlobalKeyboardManager";

function App() {
  const {
    currentPage,
    setCurrentPage,
    settings,
    sidebarOpen,
    refreshDataFromDb,
  } = useAppStore();
  const { commandPaletteOpen, closeCommandPalette } = useGlobalKeyboardManager({
    setCurrentPage,
  });
  const { isAuthenticated, user, login, logout } = useAuth();

  // Load data from database when app mounts or authentication status changes
  useEffect(() => {
    refreshDataFromDb();
    const unsubscribe = db.subscribeDbChanges(() => {
      refreshDataFromDb();
    });
    return unsubscribe;
  }, [refreshDataFromDb, isAuthenticated]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.darkMode);
  }, [settings.darkMode]);

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage />;
      case "vehicle-register":
        return <VehicleArrivalRegisterPage />;
      case "parties":
        return <PartiesPage />;
      case "suppliers":
        return <SuppliersPage />;
      case "ledger":
        return <LedgerPage />;
      case "transactions":
        return <SalesAndPurchasePage />;

      case "inventory":
        return <InventoryPage />;
      case "payments":
        return <PaymentsPage />;
      case "reports":
        return <ReportsPage />;
      case "search":
        return <SearchPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <div className="min-h-screen bg-[#f7f9fd] dark:bg-[#0a0f1d] text-slate-900 dark:text-[#e8edf5]">
      <Sidebar />
      <Header />
      <div
        className="flex flex-col min-h-screen transition-[margin-left] duration-300 ease-in-out pt-16"
        style={{ marginLeft: sidebarOpen ? 224 : 60 }}
      >
        <main className="flex-1 px-4 py-3 lg:px-5 lg:py-4 bg-[#f7f9fd] dark:bg-[#0d1323]">
          {renderPage()}
        </main>
      </div>

      <CommandPalette open={commandPaletteOpen} onClose={closeCommandPalette} />
    </div>
  );
}

export default App;
