import { cn } from '@/utils/cn';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Users, Truck, BookOpen, Receipt, Package,
  CreditCard, BarChart3, Settings as SettingsIcon, ChevronLeft, ChevronRight,
  Leaf, Search, Printer, Monitor
} from 'lucide-react';

const navItemsMap = [
  { id: 'dashboard', labelKey: 'navigation.dashboard', icon: LayoutDashboard, shortcut: '1' },
  { id: 'vehicle-register', labelKey: 'navigation.vehicleArrivalRegister', icon: Truck, shortcut: 'V' },
  { id: 'parties', labelKey: 'navigation.parties', icon: Users, shortcut: '2' },
  { id: 'suppliers', labelKey: 'navigation.suppliers', icon: Truck, shortcut: '3' },
  { id: 'ledger', labelKey: 'navigation.ledger', icon: BookOpen, shortcut: '4' },
  { id: 'transactions', labelKey: 'navigation.transactions', icon: Receipt, shortcut: '5' },
  { id: 'inventory', labelKey: 'navigation.inventory', icon: Package, shortcut: '6' },
  { id: 'payments', labelKey: 'navigation.payments', icon: CreditCard, shortcut: '7' },
  { id: 'reports', labelKey: 'navigation.reports', icon: BarChart3, shortcut: '8' },
  { id: 'settings', labelKey: 'navigation.settings', icon: SettingsIcon, shortcut: '9' },
];

export function Sidebar() {
  const { currentPage, setCurrentPage, sidebarOpen, setSidebarOpen } = useAppStore();
  const { t } = useTranslation();

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 z-40 h-screen border-r border-slate-800 bg-slate-950 text-white transition-all duration-300 ease-out flex flex-col shadow-2xl shadow-slate-950/30',
        sidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      <div className="flex items-center gap-3 border-b border-slate-800 px-3 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600">
          <Leaf className="h-5 w-5 text-white" />
        </div>
        {sidebarOpen && (
          <div className="min-w-0 flex-1 overflow-hidden">
            <h1 className="truncate text-sm font-semibold tracking-[0.18em] text-white">TFC</h1>
            <p className="truncate text-[10px] text-slate-400">{t('app.fullName')}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-2">
        {navItemsMap.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          const label = t(item.labelKey);
          
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={cn(
                'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150',
                active
                  ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-inner shadow-emerald-950/20'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              )}
              title={!sidebarOpen ? label : undefined}
            >
              <Icon className={cn(
                'h-4.5 w-4.5 shrink-0 transition-colors duration-150',
                active ? 'text-emerald-300' : 'text-slate-500 group-hover:text-slate-300'
              )} />
              
              {sidebarOpen && (
                <>
                  <span className="block flex-1 truncate">{label}</span>
                  <kbd className="whitespace-nowrap rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-500">
                    Alt+{item.shortcut}
                  </kbd>
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="flex items-center justify-center border-t border-slate-800 py-2.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-white"
      >
        {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
    </aside>
  );
}
