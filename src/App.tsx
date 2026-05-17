import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import * as db from "@/db/db";
import { useAppStore } from "@/stores/useAppStore";
import { CommandPalette } from "@/components/CommandPalette";
import { useGlobalKeyboardManager } from "@/hooks/useGlobalKeyboardManager";
import { AppRoutes } from "@/router/routes";
import { PremiumModal } from "@/components/PremiumLayout"; // Import PremiumModal
import { InvoiceViewer } from "@/components/InvoiceViewer";
import { PurchaseViewer } from "@/components/PurchaseViewer";
import type { Bill, Company, Purchase } from "@/db/schema";
import { LoginPage } from "@/pages/Login";

function AppContent() {
  const {
    settings,
    refreshDataFromDb,
    loadCompanies,
    setCurrentPage,
    modalOpen,
    modalContent,
    modalData,
    closeModal,
    currentCompany,
  } = useAppStore();
  const { commandPaletteOpen, closeCommandPalette } = useGlobalKeyboardManager({
    setCurrentPage,
  });

  // Load data from database when app mounts
  useEffect(() => {
    const initializeAppData = async () => {
      await loadCompanies();
      refreshDataFromDb();
    };
    initializeAppData();

    const unsubscribe = db.subscribeDbChanges(() => {
      refreshDataFromDb();
    });
    return unsubscribe;
  }, [refreshDataFromDb, loadCompanies]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.darkMode);
  }, [settings.darkMode]);

  // Map modalContent strings to actual components
  const renderModalContent = () => {
    switch (modalContent) {
      case "InvoiceViewer":
        return currentCompany ? (
          <InvoiceViewer
            bill={modalData.bill as Bill}
            currentCompany={currentCompany}
          />
        ) : null;
      case "PurchaseViewer":
        return currentCompany ? (
          <PurchaseViewer
            purchase={modalData.purchase as Purchase}
            currentCompany={currentCompany}
          />
        ) : null;
      // Add more cases here for other modal types
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fd] dark:bg-[#0a0f1d] text-slate-900 dark:text-[#e8edf5]">
      <AppRoutes />
      {/* <LoginPage /> */}
      <CommandPalette open={commandPaletteOpen} onClose={closeCommandPalette} />

      {/* Global Modal */}
      <PremiumModal
        isOpen={modalOpen}
        onClose={closeModal}
        title={(modalData.title as string) || ""}
        size={modalData.size as any}
      >
        {renderModalContent()}
      </PremiumModal>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
