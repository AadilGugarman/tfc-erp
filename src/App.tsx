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
import { BillingPage } from '@/pages/Billing';
import { PurchasesPage } from '@/pages/Purchases';

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
          case 'b': e.preventDefault(); setCurrentPage('billing'); break;
          case 'p': e.preventDefault(); setCurrentPage('purchases'); break;
          case 'm': e.preventDefault(); setCurrentPage('payments'); break;
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
      if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCurrentPage('search');
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
      case 'billing': return <BillingPage />;
      case 'purchases': return <PurchasesPage />;
      case 'inventory': return <InventoryPage />;
      case 'payments': return <PaymentsPage />;
      case 'reports': return <ReportsPage />;
      case 'search': return <SearchPage />;
      case 'settings': return <SettingsPage />;
      default: return <DashboardPage />;
    }
  };

  if (!authenticated) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Sidebar />
      <div
        className="flex flex-col min-h-screen transition-[margin-left] duration-300 ease-in-out"
        style={{ marginLeft: sidebarOpen ? 224 : 60 }}
      >
        <Header />
        <main className="flex-1 p-6 bg-slate-50 dark:bg-slate-900/30">{renderPage()}</main>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div
          onClick={clearNotification}
          className={[
            'fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg text-white text-[13px] font-medium cursor-pointer select-none animate-toast',
            notification.type === 'success' ? 'bg-[#16a34a]' :
            notification.type === 'error'   ? 'bg-[#dc2626]' : 'bg-[#3b5bdb]',
          ].join(' ')}
        >
          <span className="text-base leading-none">
            {notification.type === 'success' ? '✓' : notification.type === 'error' ? '✕' : 'ℹ'}
          </span>
          {notification.message}
        </div>
      )}
    </div>
  );
}

export default App;
