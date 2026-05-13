import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import * as db from "@/db/db";
import { useAppStore } from "@/stores/useAppStore";
import { CommandPalette } from "@/components/CommandPalette";
import { useGlobalKeyboardManager } from "@/hooks/useGlobalKeyboardManager";
import { AppRoutes } from "@/router/routes";

function AppContent() {
  const { settings, refreshDataFromDb, loadCompanies, setCurrentPage } =
    useAppStore();
  const { commandPaletteOpen, closeCommandPalette } = useGlobalKeyboardManager({
    setCurrentPage,
  });

  // Load data from database when app mounts
  useEffect(() => {
    // Load companies first
    loadCompanies();

    // Auto-seed test data if database is empty (first app load)
    if (db.getParties().length === 0 || db.getCompanies().length === 0) {
      db.seedRealisticTestData();
    }

    refreshDataFromDb();
    const unsubscribe = db.subscribeDbChanges(() => {
      refreshDataFromDb();
    });
    return unsubscribe;
  }, [refreshDataFromDb, loadCompanies]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.darkMode);
  }, [settings.darkMode]);

  return (
    <div className="min-h-screen bg-[#f7f9fd] dark:bg-[#0a0f1d] text-slate-900 dark:text-[#e8edf5]">
      <AppRoutes />
      <CommandPalette open={commandPaletteOpen} onClose={closeCommandPalette} />
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
