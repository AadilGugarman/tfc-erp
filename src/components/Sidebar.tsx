import { cn } from '@/utils/cn';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Users, Truck, BookOpen, Receipt, Package,
  CreditCard, BarChart3, Settings as SettingsIcon, ChevronLeft, ChevronRight,
  Layers,
} from 'lucide-react';

const NAV_GROUPS = [
  {
    label: 'Operations',
    items: [
      { id: 'dashboard',        labelKey: 'navigation.dashboard',              icon: LayoutDashboard, shortcut: '1' },
      { id: 'vehicle-register', labelKey: 'navigation.vehicleArrivalRegister', icon: Truck,           shortcut: 'V' },
      { id: 'inventory',        labelKey: 'navigation.inventory',              icon: Package,         shortcut: '6' },
    ],
  },
  {
    label: 'Accounting',
    items: [
      { id: 'parties',      labelKey: 'navigation.parties',      icon: Users,    shortcut: '2' },
      { id: 'suppliers',    labelKey: 'navigation.suppliers',    icon: Layers,   shortcut: '3' },
      { id: 'ledger',       labelKey: 'navigation.ledger',       icon: BookOpen, shortcut: '4' },
      { id: 'transactions', labelKey: 'navigation.transactions', icon: Receipt,  shortcut: '5' },
      { id: 'payments',     labelKey: 'navigation.payments',     icon: CreditCard, shortcut: '7' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { id: 'reports',  labelKey: 'navigation.reports',  icon: BarChart3,    shortcut: '8' },
      { id: 'settings', labelKey: 'navigation.settings', icon: SettingsIcon, shortcut: '9' },
    ],
  },
];

export function Sidebar() {
  const { currentPage, setCurrentPage, sidebarOpen, setSidebarOpen } = useAppStore();
  const { t } = useTranslation();

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 z-40 h-screen flex flex-col',
        'bg-white/88 dark:bg-slate-950/90 backdrop-blur-xl',
        'border-r border-slate-200 dark:border-slate-800',
        'transition-[width] duration-300 ease-in-out',
        sidebarOpen ? 'w-56' : 'w-[60px]'
      )}
    >
      {/* Brand Section */}
      <div
        className={cn(
          'flex items-center border-b border-slate-200 dark:border-slate-800',
          'h-14 shrink-0 overflow-hidden px-3 gap-3 transition-all duration-300',
          'bg-gradient-to-r from-white to-slate-50 dark:from-slate-950 dark:to-slate-900/50'
        )}
      >
        {/* Logo */}
        <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-700 shadow-md shadow-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/40 transition-all duration-200">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="currentColor" opacity="0.2" />
            <path d="M12 2c-1.5 0-2.8.8-3.5 2L12 9l3.5-5C14.8 2.8 13.5 2 12 2z" fill="currentColor" />
            <path d="M9 18c1.2 1.8 2.4 2.8 3 3 .6-.2 1.8-1.2 3-3H9z" fill="currentColor" />
          </svg>
        </div>

        {/* Brand text */}
        {sidebarOpen && (
          <div className="min-w-0 flex-1 overflow-hidden animate-fade-in">
            <div className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
              TFC
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 leading-tight mt-0.5 truncate">
              Talha Fruit Co.
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-5 px-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {sidebarOpen && (
              <div className="mb-2 px-3">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600 select-none">
                  {group.label}
                </span>
              </div>
            )}
            <div className={cn(
              'space-y-1',
              !sidebarOpen && 'space-y-2'
            )}>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = currentPage === item.id;
                const label = t(item.labelKey);

                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id)}
                    title={!sidebarOpen ? label : undefined}
                    className={cn(
                      'group relative w-full rounded-lg transition-all duration-150 font-medium',
                      sidebarOpen
                        ? cn(
                          'flex items-center gap-3 px-3 py-2.5 text-sm',
                          active
                            ? 'bg-gradient-to-r from-indigo-50 to-indigo-50/50 dark:from-indigo-950/40 dark:to-indigo-900/30 text-indigo-700 dark:text-indigo-300 shadow-sm shadow-indigo-200/50 dark:shadow-indigo-950/50'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                          )
                        : cn(
                          'flex h-10 w-10 items-center justify-center mx-auto',
                          active
                            ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
                            : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                        )
                    )}
                  >
                    {/* Active indicator line (expanded only) */}
                    {active && sidebarOpen && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-indigo-600 dark:bg-indigo-500" />
                    )}

                    {/* Icon */}
                    <Icon className={cn(
                      'h-4 w-4 shrink-0 transition-all duration-150',
                      active && sidebarOpen
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : active
                          ? 'text-white'
                          : ''
                    )} />

                    {/* Label (expanded only) */}
                    {sidebarOpen && (
                      <>
                        <span className="flex-1 text-left truncate">
                          {label}
                        </span>
                        {active && (
                          <div className="ml-auto text-xs font-mono text-indigo-600 dark:text-indigo-400 opacity-70">
                            {item.shortcut}
                          </div>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-slate-200 dark:border-slate-800 p-2">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={cn(
            'flex items-center justify-center w-full h-9 rounded-lg',
            'text-slate-500 dark:text-slate-400',
            'hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-700 dark:hover:text-slate-200',
            'transition-all duration-150',
            'font-medium text-sm'
          )}
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
