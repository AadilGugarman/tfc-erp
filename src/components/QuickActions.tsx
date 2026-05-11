import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/stores/useAppStore';
import {
  Plus,
  Truck,
  Receipt,
  Package,
  ShoppingCart,
  Users,
  CreditCard,
  BookOpen,
  BarChart3,
  Settings,
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  page: string;
  shortcut?: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'vehicle',
    label: 'New Vehicle Entry',
    icon: Truck,
    color: 'from-blue-500 to-blue-600',
    page: 'vehicle-register',
    shortcut: 'Alt+V',
  },
  {
    id: 'bill',
    label: 'Create Bill',
    icon: Receipt,
    color: 'from-emerald-500 to-emerald-600',
    page: 'billing',
    shortcut: 'Alt+B',
  },
  {
    id: 'inventory',
    label: 'Add Inventory',
    icon: Package,
    color: 'from-amber-500 to-amber-600',
    page: 'inventory',
    shortcut: 'Alt+I',
  },
  {
    id: 'purchase',
    label: 'Add Purchase',
    icon: ShoppingCart,
    color: 'from-purple-500 to-purple-600',
    page: 'purchases',
    shortcut: 'Alt+P',
  },
  {
    id: 'party',
    label: 'New Party',
    icon: Users,
    color: 'from-pink-500 to-pink-600',
    page: 'parties',
    shortcut: 'Alt+U',
  },
  {
    id: 'payment',
    label: 'Receive Payment',
    icon: CreditCard,
    color: 'from-green-500 to-green-600',
    page: 'payments',
    shortcut: 'Alt+M',
  },
  {
    id: 'ledger',
    label: 'Open Ledger',
    icon: BookOpen,
    color: 'from-indigo-500 to-indigo-600',
    page: 'ledger',
    shortcut: 'Alt+L',
  },
  {
    id: 'search',
    label: 'Search Transactions',
    icon: BarChart3,
    color: 'from-cyan-500 to-cyan-600',
    page: 'search',
    shortcut: 'Ctrl+K',
  },
];

export function QuickActions() {
  const { setCurrentPage } = useAppStore();
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white px-1">Quick Actions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => setCurrentPage(action.page)}
              className={cn(
                'group relative overflow-hidden rounded-lg p-4',
                'bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800',
                'hover:shadow-md dark:hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-black/50',
                'transition-all duration-200 ease-out',
                'hover:-translate-y-0.5'
              )}
            >
              {/* Background gradient */}
              <div className={cn(
                'absolute inset-0 opacity-0 group-hover:opacity-5',
                `bg-gradient-to-br ${action.color}`,
                'transition-opacity duration-200'
              )} />

              {/* Content */}
              <div className="relative space-y-2">
                <div className={cn(
                  'h-10 w-10 rounded-lg flex items-center justify-center',
                  `bg-gradient-to-br ${action.color} text-white shadow-lg`,
                  'group-hover:shadow-xl transition-shadow duration-200'
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                    {action.label}
                  </p>
                  {action.shortcut && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
                      {action.shortcut}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
