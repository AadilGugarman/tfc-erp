import { useEffect } from 'react';
import * as db from '@/db/db';
import { useAppStore } from '@/stores/useAppStore';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { LoginPage } from '@/pages/Login';
import { DashboardPage } from '@/pages/Dashboard';
import { VehicleArrivalRegisterPage } from '@/pages/VehicleArrivalRegister';
import { PartiesPage } from '@/pages/Parties';
import { SuppliersPage } from '@/pages/Suppliers';
import { LedgerPage } from '@/pages/Ledger';
import { TransactionsPage } from '@/pages/Transactions';
import { InventoryPage } from '@/pages/Inventory';
import { PaymentsPage } from '@/pages/Payments';
import { ReportsPage } from '@/pages/Reports';
import { SettingsPage } from '@/pages/Settings';
import { SearchPage } from '@/pages/Search';
import { PrintPreviewPage } from '@/pages/PrintPreview';
import { TabletViewPage } from '@/pages/TabletView';

function App() {
  const { currentPage, setCurrentPage, settings, notification, clearNotification, sidebarOpen, authenticated, login } = useAppStore();

  // Seed demo data on mount
  useEffect(() => {
    db.seedDemoData();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.darkMode);
  }, [settings.darkMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey) {
        switch (e.key) {
          case '1': e.preventDefault(); setCurrentPage('dashboard'); break;
          case 'v': e.preventDefault(); setCurrentPage('vehicle-register'); break;
          case '2': e.preventDefault(); setCurrentPage('parties'); break;
          case '3': e.preventDefault(); setCurrentPage('suppliers'); break;
          case '4': e.preventDefault(); setCurrentPage('ledger'); break;
          case '5': e.preventDefault(); setCurrentPage('transactions'); break;
          case '6': e.preventDefault(); setCurrentPage('inventory'); break;
          case '7': e.preventDefault(); setCurrentPage('payments'); break;
          case '8': e.preventDefault(); setCurrentPage('reports'); break;
          case '9': e.preventDefault(); setCurrentPage('settings'); break;
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [setCurrentPage]);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage />;
      case 'vehicle-register': return <VehicleArrivalRegisterPage />;
      case 'parties': return <PartiesPage />;
      case 'suppliers': return <SuppliersPage />;
      case 'ledger': return <LedgerPage />;
      case 'transactions': return <TransactionsPage />;
      case 'billing': return <TransactionsPage />;
      case 'purchases': return <TransactionsPage />;
      case 'inventory': return <InventoryPage />;
      case 'payments': return <PaymentsPage />;
      case 'reports': return <ReportsPage />;
      case 'search': return <SearchPage />;
      case 'print-preview': return <PrintPreviewPage />;
      case 'tablet-view': return <TabletViewPage />;
      case 'settings': return <SettingsPage />;
      default: return <DashboardPage />;
    }
  };

  if (!authenticated) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Sidebar />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <Header />
        <main className="p-6">{renderPage()}</main>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl text-white text-sm font-medium flex items-center gap-2 animate-bounce-in ${
          notification.type === 'success' ? 'bg-emerald-600' :
          notification.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        }`} onClick={clearNotification}>
          {notification.type === 'success' ? '✓' : notification.type === 'error' ? '✕' : 'ℹ'} {notification.message}
        </div>
      )}
    </div>
  );
}

export default App;
