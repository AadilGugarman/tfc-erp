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
import { DialogProvider, DialogRoot } from "@/components/ui/dialogs";
import { useAuth } from "@/hooks/useAuth";

function AppContent() {
  const settings = useAppStore((state) => state.settings);
  const loadCompanies = useAppStore((state) => state.loadCompanies);
  const setCurrentPage = useAppStore((state) => state.setCurrentPage);
  const modalOpen = useAppStore((state) => state.modalOpen);
  const modalContent = useAppStore((state) => state.modalContent);
  const modalData = useAppStore((state) => state.modalData);
  const closeModal = useAppStore((state) => state.closeModal);
  const currentCompany = useAppStore((state) => state.currentCompany);

  // Wait for auth session restore before loading any data that requires a token
  const { isAuthenticated, isInitializing } = useAuth();

  const { commandPaletteOpen, closeCommandPalette } = useGlobalKeyboardManager({
    setCurrentPage,
  });

  // Load companies only after auth is confirmed — prevents "missing token" errors
  // on startup when the in-memory token hasn't been restored yet.
  // NOTE: We NO LONGER load all data on startup. Instead, each page loads only
  // the data it needs via usePageData hook. This significantly improves startup time.
  useEffect(() => {
    if (isInitializing || !isAuthenticated) return;

    const initializeAppData = async () => {
      await loadCompanies();
      // Do NOT call refreshDataFromDb() here - pages will load their own data
    };
    initializeAppData();

    // Still subscribe to DB changes for real-time updates
    // but only refresh currently visible page data, not everything
    const unsubscribe = db.subscribeDbChanges(() => {
      // Pages will handle their own data refresh if needed
      // This prevents mass reload of all data when any data changes
    });
    return unsubscribe;
  }, [isAuthenticated, isInitializing, loadCompanies]);

  useEffect(() => {
    const theme = settings.appearance.theme;
    const isDark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
  }, [settings.appearance.theme]);

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
    <DialogProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
      {/* Global dialog renderer — renders on top of everything */}
      <DialogRoot />
    </DialogProvider>
  );
}

export default App;
